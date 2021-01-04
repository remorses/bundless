import {
    File as BabelAST,
    identifier,
    Identifier,
    Statement,
} from '@babel/types'
import fs from 'fs'
import { parse as _parse } from '@babel/parser'
import { Plugin, logger } from '@bundless/cli'
import { transform } from '@babel/core'

const runtimeNamespace = 'react-refresh-runtime'
const runtimePath = `/_react-refresh-runtime_?namespace=${runtimeNamespace}`

export default ReactRefreshPlugin

export function ReactRefreshPlugin({} = {}): Plugin {
    return {
        name: 'react-refresh',
        setup({ onTransform, onResolve, onLoad, isBuild }) {
            if (process.env.NODE_ENV === 'production' || isBuild) {
                return
            }

            // injects stuff in html
            onTransform({ filter: /\.html$/ }, (args) => {
                // console.log('transforming html with react refresh')
                return {
                    contents: transformHtml(args.contents),
                }
            })

            onResolve({ filter: new RegExp(runtimePath) }, (args) => {
                if (args.path === runtimePath) {
                    return {
                        path: runtimePath,
                        namespace: runtimeNamespace,
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
                    ${await (
                        await fs.promises.readFile(runtimePath)
                    ).toString()}
                    ${debounce.toString()}
                    exports.performReactRefresh = debounce(exports.performReactRefresh, 16)
                    export default exports
                    `
                    return {
                        loader: 'jsx',
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
                        require('@babel/plugin-syntax-jsx'),
                        require('@babel/plugin-syntax-class-properties'),
                        require('react-refresh/babel'),
                        {
                            visitor: {
                                Program(path) {
                                    // Insert at the beginning a string "Hello World" --> not valid JS code
                                    path.unshiftContainer(
                                        'body',
                                        makeHeader(args.path),
                                    )
                                },
                            },
                        },
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

                const nonComponentExports = result.ast
                    ? getNonComponentExports(result.ast)
                    : []
                const hmrDisabledMessage = `${
                    args.path
                } disabled react refresh because it has react components as exports! Exported names are ${JSON.stringify(
                    nonComponentExports,
                )}`
                if (nonComponentExports.length) {
                    logger.warn(hmrDisabledMessage)
                }

                const footer = makeFooter(nonComponentExports.length === 0)

                return {
                    loader: 'jsx',
                    contents: `${result.code}${footer}`,
                    map: result.map,
                }
            })
        },
    }
}

function getNonComponentExports(ast: BabelAST) {
    // Every export must be a React component.
    return flatten(
        ast.program.body.map((node) => {
            if (node.type !== 'ExportNamedDeclaration') {
                return []
            }
            const { declaration, specifiers } = node
            if (declaration && declaration.type === 'VariableDeclaration') {
                return declaration.declarations
                    .filter(
                        (x) =>
                            x.id.type === 'Identifier' &&
                            !isComponentishName(x.id.name),
                    )
                    .map((x) => (x.id.type === 'Identifier' ? x.id?.name : ''))
            }
            return specifiers
                .filter(
                    ({ exported }) =>
                        exported.type === 'Identifier' &&
                        !isComponentishName(exported.name),
                )
                .map((x) =>
                    x.exported.type === 'Identifier' ? x.exported.name : '',
                )
        }),
    )
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

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function(flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten,
        )
    }, [])
}

const makeHeader = (path) => {
    return [
        ...parse(`const ${THIS_PATH_NAME} = ${JSON.stringify(path)}`),
        ...header,
    ]
}

const THIS_PATH_NAME = '__this_path__'

const header = parse(
    `
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
    RefreshRuntime.register(type, ${THIS_PATH_NAME} + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`,
)

const makeFooter = (accept) => `
if (import.meta.hot) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;

  ${accept ? `import.meta.hot.accept();` : ''}
  if (!window.__bundless_plugin_react_timeout) {
    window.__bundless_plugin_react_timeout = setTimeout(() => {
      window.__bundless_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}`

export function parse(source: string): Statement[] {
    try {
        return _parse(source, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'classProperties',
                // required for import.meta.hot
                'importMeta',
            ],
        }).program.body
    } catch (e) {
        throw new Error(`Cannot parse with babel: ${e}`)
    }
}
