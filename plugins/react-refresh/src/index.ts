import type { File as BabelAST } from '@babel/types'
import fs from 'fs'
import { Plugin } from 'espack'
import { transform } from '@babel/core'

const runtimeNamespace = 'react-refresh-runtime'
const runtimePath = `_react-refresh-runtime_?namespace=${runtimeNamespace}`

export function ReactRefreshPlugin({} = {}): Plugin {
    return {
        name: 'react-refresh',
        setup({ onTransform, onResolve, onLoad }) {
            if (process.env.NODE_ENV === 'production') {
                return
            }

            // injects stuff in html
            onTransform({ filter: /\.html$/ }, (args) => {
                return {
                    contents: transformHtml(args.contents),
                }
            })

            onLoad(
                { filter: /.*/, namespace: runtimeNamespace },
                async (args) => {
                    const runtimePath = require.resolve(
                        'react-refresh/cjs/react-refresh-runtime.development.js',
                    )
                    const runtimeCode = `
const exports = {}
${await (await fs.promises.readFile(runtimePath)).toString}
${debounce.toString()}
exports.performReactRefresh = debounce(exports.performReactRefresh, 16)
export default exports
`
                    return {
                        loader: 'js',
                        contents: runtimeCode,
                    }
                },
            )

            onTransform({ filter: /\.(t|j)sx$/ }, async (args) => {

                if (args.path.includes('node_modules')) {
                    return
                }

                const result = await transform(args.contents, {
                    plugins: [
                        require('@babel/plugin-syntax-import-meta'),
                        require('react-refresh/babel'),
                    ],
                    ast: true,
                    sourceMaps: true,
                    sourceFileName: args.path,
                })

                if (!result || !result.code) {
                    return
                }

                if (!/\$RefreshReg\$\(/.test(result.code)) {
                    // no component detected in the file
                    return
                }

                const header = `
      import RefreshRuntime from "${runtimePath}";
    
      let prevRefreshReg;
      let prevRefreshSig;
    
      if (!window.__vite_plugin_react_preamble_installed__) {
        throw new Error(
          "vite-plugin-react can't detect preamble. Something is wrong. See https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201"
        );
      }
    
      if (import.meta.hot) {
        prevRefreshReg = window.$RefreshReg$;
        prevRefreshSig = window.$RefreshSig$;
        window.$RefreshReg$ = (type, id) => {
          RefreshRuntime.register(type, ${JSON.stringify(args.path)} + " " + id)
        };
        window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
      }`.replace(/[\n]+/gm, '')

                const footer = `
      if (import.meta.hot) {
        window.$RefreshReg$ = prevRefreshReg;
        window.$RefreshSig$ = prevRefreshSig;
    
        ${
            result.ast && isRefreshBoundary(result.ast)
                ? `import.meta.hot.accept();`
                : `` // TODO warn when not a boundary, this means that react refresh is not enabled
        }
        if (!window.__vite_plugin_react_timeout) {
          window.__vite_plugin_react_timeout = setTimeout(() => {
            window.__vite_plugin_react_timeout = 0;
            RefreshRuntime.performReactRefresh();
          }, 30);
        }
      }`

                return {
                    loader: 'js',
                    contents: `${header}${result.code}${footer}`,
                    map: result.map,
                }
            })
        },
    }
}



function isRefreshBoundary(ast: BabelAST) {
    // Every export must be a React component.
    return ast.program.body.every((node) => {
        if (node.type !== 'ExportNamedDeclaration') {
            return true
        }
        const { declaration, specifiers } = node
        if (declaration && declaration.type === 'VariableDeclaration') {
            return declaration.declarations.every(
                ({ id }) =>
                    id.type === 'Identifier' && isComponentishName(id.name),
            )
        }
        return specifiers.every(
            ({ exported }) =>
                exported.type === 'Identifier' &&
                isComponentishName(exported.name),
        )
    })
}

function isComponentishName(name: string) {
    return typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z'
}

function debounce(fn: () => void, delay: number) {
    let handle: any
    return () => {
        clearTimeout(handle)
        handle = setTimeout(fn, delay)
    }
}

function transformHtml(contents) {
    return contents.replace(
        /<body.*?>/,
        `$&
  <script type="module">
  import RefreshRuntime from "${runtimePath}"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
  </script>`,
    )
}
