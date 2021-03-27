import { transform, TransformOptions } from '@babel/core'
import { ParserPlugin } from '@babel/parser'
import { Plugin } from '@bundless/cli'
import { babelParserOpts } from '@bundless/cli/dist/utils'

export default BabelPlugin

interface Options {
    babelOptions: TransformOptions
    filter?: RegExp
}

export function BabelPlugin({
    babelOptions,
    filter = /\.(t|j)sx?$/,
}: Options): Plugin {
    return {
        name: 'react-refresh',
        enforce: 'pre',
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
