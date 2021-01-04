import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { RawSourceMap } from 'source-map'
import { PluginHooks } from '../plugins-executor'
import { fileToImportPath, jsTypeRegex, readFile } from '../utils'

const sourcemapRegex = /\/\/#\ssourceMappingURL=([\w\d-_\.]+)\n*$/

export function ResolveSourcemapPlugin({} = {}) {
    return {
        name: 'resolve-sourcemaps',
        setup: ({
            onTransform,
            pluginsExecutor,
            ctx: { root },
        }: PluginHooks) => {
            onTransform({ filter: jsTypeRegex }, async (args) => {
                let contents = args.contents
                const match = contents.match(sourcemapRegex)

                if (!match) {
                    return
                }
                let filePath = match[1]
                if (!filePath || filePath.startsWith('data:')) {
                    // TODO skip other data: like formats in sourcemaps
                    return
                }
                if (!filePath.startsWith('.') && !filePath.startsWith('/')) {
                    filePath = './' + filePath
                }
                const resolved = await pluginsExecutor.resolve({
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
                    `//# sourceMappingURL=${fileToImportPath(
                        root,
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
