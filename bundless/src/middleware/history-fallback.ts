import { Middleware } from 'koa'
import path from 'path'
import { logger } from '../logger'
import { PluginsExecutor } from '../plugins-executor'
import { cleanUrl, importPathToFile } from '../utils'

export function historyFallbackMiddleware({
    root,
    pluginsExecutor,
}: {
    root: string
    pluginsExecutor: PluginsExecutor
}): Middleware {
    return async (ctx, next) => {
        if (ctx.status !== 404) {
            return next()
        }

        if (ctx.method !== 'GET') {
            logger.debug(`not redirecting ${ctx.url} (not GET)`)
            return next()
        }

        const accept = ctx.headers && ctx.headers.accept
        if (typeof accept !== 'string') {
            logger.debug(`not redirecting ${ctx.url} (no headers.accept)`)
            return next()
        }

        if (accept.includes('application/json')) {
            logger.debug(`not redirecting ${ctx.url} (json)`)
            return next()
        }

        if (!accept.includes('text/html')) {
            logger.debug(`not redirecting ${ctx.url} (not accepting html)`)
            return next()
        }
        // use the executor to resolve virtual html files
        // TODO decide if we want to pass the path with index.html or the normal path and let the plugins decide if they watn to serve html, the second way is harder because html should be served as last thing (fallback) but user plugins run first
        let filePath = !cleanUrl(ctx.path).endsWith('.html')
            ? path.posix.join(ctx.path, 'index.html')
            : ctx.path

        const {
            contents: resolvedHtml,
            path: resolveHtmlPath,
        } = await pluginsExecutor.resolveLoadTransform({
            path: importPathToFile(root, filePath),
            expectedExtensions: ['.html'],
        })

        if (resolvedHtml) {
            send(
                ctx,
                resolvedHtml,
                '/' + path.relative(root, resolveHtmlPath || ''),
            )
            return next()
        }
        logger.debug(`fallback ${ctx.url} to html`)
        const {
            contents: resolvedTopHtml,
        } = await pluginsExecutor.resolveLoadTransform({
            path: path.resolve(root, 'index.html'),
            expectedExtensions: ['.html'],
        })

        if (resolvedTopHtml) {
            send(ctx, resolvedTopHtml, '/index.html')
            return next()
        }

        return next()
        // return next()
    }
}

function send(ctx, resolvedHtml, as = '') {
    logger.debug(`Resolved html for ${ctx.path} as ${as}`)
    ctx.body = resolvedHtml
    ctx.status = 200
    ctx.type = 'html'
    // return next()
}
