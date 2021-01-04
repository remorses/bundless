import { Middleware } from 'koa'
import path from 'path'
import send from 'koa-send'
import { logger } from '../logger'
import { PluginsExecutor } from '../plugins-executor'
import { importPathToFile } from '../utils'

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
        // use the executor first to resolve virtual html files
        const {
            contents: resolvedHtml,
        } = await pluginsExecutor.resolveLoadTransform({
            path: importPathToFile(root, ctx.path),
            expectedExtensions: ['.html'],
        })
        if (resolvedHtml) {
            logger.debug(`Resolved html for ${ctx.path}`)
            ctx.body = resolvedHtml
            ctx.status = 200
            ctx.type = 'html'
            return next()
        }

        logger.debug(`redirecting ${ctx.url} to /index.html`)
        await send(ctx, `index.html`, { root }).catch(() => {})
        await send(ctx, `index.html`, {
            root: path.join(root, 'public'),
        }).catch(() => {})
        return next()
        // return next()
    }
}
