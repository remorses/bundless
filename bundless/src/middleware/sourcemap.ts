import chalk from 'chalk'
import { Middleware } from 'koa'
import path from 'path'
import { RawSourceMap } from 'source-map'
import { logger } from '../logger'
import { importPathToFile, readFile } from '../utils'

// changes sourcemaps to point to right files
export const sourcemapMiddleware = ({ root }): Middleware => {
    return async function sourcemap(ctx, next) {
        if (!ctx.path.endsWith('.map')) {
            return next()
        }
        logger.debug(`Handling sourcemap request for '${ctx.path}'`)
        const filename = importPathToFile(root, ctx.path)
        const content = await readFile(filename)
        const map: RawSourceMap = JSON.parse(content)
        if (!map.sources) {
            logger.warn(`No sources found for sourcemap '${ctx.path}'`)
            return next()
        }
        if (map.sourcesContent && map.sources.every(path.isAbsolute)) {
            return next()
        }
        const sourcesContent = map.sourcesContent || []
        const sourceRoot = path.resolve(
            path.dirname(filename),
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
                                    `Sourcemap "${filename}" points to non-existent source: "${originalPath}"`,
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
        ctx.body = contents
        ctx.status = 200
        ctx.type = 'application/json'
    }
}
