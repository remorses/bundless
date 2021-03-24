import {
    File as BabelAST,
    identifier,
    Identifier,
    Statement,
} from '@babel/types'
import fs from 'fs'
import slash from 'slash'
import { parse as _parse, ParserPlugin } from '@babel/parser'
import { Plugin, logger } from '@bundless/cli'
import { babelParserOpts, osAgnosticPath } from '@bundless/cli/dist/utils'
import { transform } from '@babel/core'
import path, { relative } from 'path'

const runtimeNamespace = 'react-refresh-runtime'
const runtimePath = `_react-refresh-runtime_.js`

export default ReactRefreshPlugin

export function ReactRefreshPlugin({
    babelPlugins = [] as any[],
    filter = /\.(t|j)sx$/,
} = {}): Plugin {
    return {
        name: 'react-refresh',
        enforce: 'pre',
        setup({ onTransform, onResolve, onLoad, ctx: { root, isBuild } }) {
            if (process.env.NODE_ENV === 'production' || isBuild) {
                return
            }

            // injects stuff in html
            onTransform({ filter: /\.html$/ }, (args) => {
                return {
                    contents: transformHtml(args.contents),
                }
            })

            onResolve({ filter: new RegExp(runtimePath) }, (args) => {
                if (path.basename(args.path) !== runtimePath) {
                    return
                }

                return {
                    path: runtimePath,
                    namespace: runtimeNamespace,
                }
            })

            onLoad(
                { filter: /.*/, namespace: runtimeNamespace },
                async (args) => {
                    const runtimeModulePath = require.resolve(
                        'react-refresh/cjs/react-refresh-runtime.development.js',
                    )
                    const runtimeCode = `
                    const exports = {}
                    const process = {env: {NODE_ENV: 'development'}}
                    ${await (
                        await fs.promises.readFile(runtimeModulePath)
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

            onTransform({ filter }, async (args) => {
                if (args.path.includes('node_modules')) {
                    return
                }

                // TODO maybe also process js files if they import react, this would enable react refresh for workspaces? but this way they certainly would have non react components as export and break everything

                const parserPlugins: ParserPlugin[] = [
                    'jsx',
                    'importMeta',
                    'topLevelAwait',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                ]
                if (/\.tsx?$/.test(args.path)) {
                    parserPlugins.push('typescript', 'decorators-legacy')
                }
                const result = await transform(args.contents, {
                    parserOpts: {
                        ...babelParserOpts,
                        plugins: parserPlugins,
                        sourceFilename: args.path,
                    },
                    plugins: [
                        // require('@babel/plugin-transform-react-jsx-self'), // TODO add react source plugin for line numbers?
                        // require('@babel/plugin-transform-react-jsx-source'),
                        [
                            require('react-refresh/babel'),
                            { skipEnvCheck: true },
                        ],
                        {
                            visitor: {
                                Program(path) {
                                    // Insert at the beginning a string "Hello World" --> not valid JS code
                                    path.unshiftContainer(
                                        'body',
                                        makeHeader(
                                            slash(relative(root, args.path)),
                                        ) as any,
                                    )
                                },
                            },
                        },
                        ...(babelPlugins || []),
                    ],
                    ast: true,
                    babelrc: false,
                    configFile: false,
                    sourceType: 'module',
                    filename: args.path,
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
                    ? getNonComponentExports(result.ast as any)
                    : []
                const hmrDisabledMessage = `"${osAgnosticPath(
                    args.path,
                    root,
                )}" has non react components exports ${nonComponentExports.join(
                    ', ',
                )}`
                if (nonComponentExports.length) {
                    logger.warn(hmrDisabledMessage)
                }

                const footer = makeFooter(true)

                return {
                    contents: `${result.code}${footer}`,
                    map: result.map,
                }
            })
        },
    }
}

function getNonComponentExports(ast: BabelAST) {
    // Every export must be a React component.
    // TODO check that default export is a named function
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
                            !isComponentLikeName(x.id.name),
                    )
                    .map((x) => (x.id.type === 'Identifier' ? x.id?.name : ''))
            }
            return specifiers
                .filter(
                    ({ exported }) =>
                        exported.type === 'Identifier' &&
                        !isComponentLikeName(exported.name),
                )
                .map((x) =>
                    x.exported.type === 'Identifier' ? x.exported.name : '',
                )
        }),
    )
}

function isComponentLikeName(name: string) {
    return (
        name === 'default' ||
        name.startsWith('__') || // probably some generated code
        (typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z')
    )
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
  import RefreshRuntime from "/${runtimePath}?namespace=${runtimeNamespace}"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__bundless_plugin_react_preamble_installed__ = true
  </script>`,
    )
}

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function (flat, toFlatten) {
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
import RefreshRuntime from "/${runtimePath}";

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

export function parse(
    source: string,
    sourceFilename = 'file.tsx',
): Statement[] {
    try {
        return _parse(source, { ...babelParserOpts, sourceFilename }).program
            .body
    } catch (e) {
        throw new Error(`Cannot parse with babel: ${e}`)
    }
}
