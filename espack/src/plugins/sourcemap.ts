import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { RawSourceMap } from 'source-map'
import { PluginHooks } from '../plugin'
import { readFile } from '../utils'

const debug = require('debug')('esbuild')

export function SourcemapPlugin({} = {}) {
    return {
        name: 'sourcemaps',
        setup: ({ onLoad }: PluginHooks) => {
            onLoad({ filter: /\.map$/ }, async (args) => {
                const file = args.path
                const content = await readFile(file) // TODO convert to onTransform or this loadFile won't work
                const map: RawSourceMap = JSON.parse(content)
                if (!map.sources) {
                    return
                }
                if (map.sourcesContent && map.sources.every(path.isAbsolute)) {
                    return
                }
                const sourcesContent = map.sourcesContent || []
                const sourceRoot = path.resolve(
                    path.dirname(args.path),
                    map.sourceRoot || '',
                )
                map.sources = await Promise.all(
                    map.sources.map(async (source, i) => {
                        const originalPath = path.resolve(sourceRoot, source)
                        if (!sourcesContent[i]) {
                            try {
                                sourcesContent[i] = await readFile(originalPath)
                            } catch (err) {
                                if (err.code === 'ENOENT') {
                                    console.error(
                                        chalk.red(
                                            `Sourcemap "${file}" points to non-existent source: "${originalPath}"`,
                                        ),
                                    )
                                    return source
                                }
                                throw err
                            }
                        }
                        return originalPath
                    }),
                )
                map.sourcesContent = sourcesContent
                const contents = JSON.stringify(map)
                return { contents }
            })
        },
    }
}
