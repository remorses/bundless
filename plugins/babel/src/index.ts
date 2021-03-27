import { ParserOptions, transform, TransformOptions } from '@babel/core'
import { ParserPlugin } from '@babel/parser'
import { Plugin } from '@bundless/cli'

export default BabelPlugin

interface Options {
    /**
     * Options passed to babel
     */
    babelOptions: TransformOptions
    /**
     * Filter which files should babel transform
     */
    filter?: RegExp
    /**
     * Run the plugin before or after bundless builtin plugins (like esbuild transform)
     */
    enforce?: 'pre' | 'post'
}

export function BabelPlugin({
    babelOptions,
    filter = /\.(t|j)sx?$/,
    enforce = 'pre',
}: Options): Plugin {
    return {
        name: 'react-refresh',
        enforce,
        setup({ onTransform, onResolve, onLoad, ctx: { root, isBuild } }) {
            onTransform({ filter }, async (args) => {
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
                    plugins: [],
                    ast: false,
                    babelrc: false,
                    configFile: false,
                    sourceType: 'module',
                    filename: args.path,
                    sourceMaps: true,
                    sourceFileName: args.path,
                    ...babelOptions,
                })

                if (!result || !result.code) {
                    return
                }

                return {
                    loader: 'default',
                    contents: result.code,
                    map: result.map,
                }
            })
        },
    }
}

const babelParserOpts: ParserOptions = {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    plugins: [
        // required for import.meta.hot
        'importMeta',
        'jsx',
        // by default we enable proposals slated for ES2020.
        // full list at https://babeljs.io/docs/en/next/babel-parser#plugins
        // this should be kept in async with @vue/compiler-core's support range
        'bigInt',
        'optionalChaining',
        'classProperties',
        'nullishCoalescingOperator',
    ],
}
