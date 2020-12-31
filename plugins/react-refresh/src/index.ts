import type { File as BabelAST } from '@babel/types'
import fs from 'fs'
import { Plugin } from '@bundless/cli'
import { transform } from '@babel/core'

const runtimeNamespace = 'react-refresh-runtime'
const runtimePath = `/_react-refresh-runtime_?namespace=${runtimeNamespace}`

export default ReactRefreshPlugin

export function ReactRefreshPlugin({} = {}): Plugin {
    return {
        name: 'react-refresh',
        setup({ onTransform, onResolve, onLoad }) {
            if (process.env.NODE_ENV === 'production') {
                return
            }

            // injects stuff in html
            onTransform({ filter: /\.html$/ }, (args) => {
                // console.log('transforming html with react refresh')
                return {
                    contents: transformHtml(args.contents),
                }
            })

            onResolve({filter: new RegExp(runtimePath), }, args => {
                if (args.path === runtimePath) {
                    return {
                        path: runtimePath,
                        namespace: runtimeNamespace
                    }
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
const process = {env: {NODE_ENV: 'development'}}
${await (await fs.promises.readFile(runtimePath)).toString()}
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
    
      if (!window.__bundless_plugin_react_preamble_installed__) {
        throw new Error(
          "bundless-plugin-react can't detect preamble. Something is wrong."
        );
      }
    
      if (import.meta.hot) {
        prevRefreshReg = window.$RefreshReg$;
        prevRefreshSig = window.$RefreshSig$;
        window.$RefreshReg$ = (type, id) => {
          RefreshRuntime.register(type, ${JSON.stringify(args.path)} + " " + id)
        };
        window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
      }`

                const footer = `
      if (import.meta.hot) {
        window.$RefreshReg$ = prevRefreshReg;
        window.$RefreshSig$ = prevRefreshSig;
    
        ${
            result.ast && isRefreshBoundary(result.ast)
                ? `import.meta.hot.accept();`
                : `console.warn(import.meta.url + ' is not a react refresh boundary because it is exporting non react components!');` // TODO warn when not a boundary, this means that react refresh is not enabled
        }
        if (!window.__bundless_plugin_react_timeout) {
          window.__bundless_plugin_react_timeout = setTimeout(() => {
            window.__bundless_plugin_react_timeout = 0;
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


// TODO return the names of non react exports for easier debugging, maybe also return the file and line number
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
  window.__bundless_plugin_react_preamble_installed__ = true
  </script>`,
    )
}
