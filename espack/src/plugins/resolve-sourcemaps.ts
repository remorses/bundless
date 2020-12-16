import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { RawSourceMap } from 'source-map'
import { PluginHooks } from '../plugin'
import { fileToRequest, jsTypeRegex, readFile } from '../utils'

const sourcemapRegex = /\/\/#\ssourceMappingURL=([\w\d-_\.]+)\n*$/ // TODO do not match data:, support for spaces in file paths and non word characters

export function ResolveSourcemapPlugin({} = {}) {
    return {
        name: 'resolve-sourcemaps',
        setup: ({ onTransform, resolve, config }: PluginHooks) => {
            onTransform({ filter: jsTypeRegex }, async (args) => {
                let contents = args.contents
                const match = contents.match(sourcemapRegex)
                // console.log({ match, path: args.path })
                if (!match) {
                    return
                }
                let filePath = match[1]
                if (!filePath) {
                    return
                }
                if (!filePath.startsWith('.') && !filePath.startsWith('/')) {
                    filePath = './' + filePath
                }
                const resolved = await resolve({
                    importer: args.path,
                    path: filePath.trim(),
                    namespace: '',
                    resolveDir: path.dirname(args.path),
                })
                if (!resolved?.path) {
                    return
                }
                contents = contents.replace(
                    sourcemapRegex,
                    `//# sourceMappingURL=${fileToRequest(
                        config.root!,
                        resolved?.path,
                    )}`,
                )

                return {
                    contents,
                }
            })
        },
    }
}
