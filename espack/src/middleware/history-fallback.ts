import { Middleware } from 'koa'
import path from 'path'
import send from 'koa-send'
import { logger } from '../logger'

export function historyFallbackMiddleware({ root }): Middleware {
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

        logger.debug(`redirecting ${ctx.url} to /index.html`)
        await send(ctx, `index.html`, { root }).catch(() => {})
        await send(ctx, `index.html`, {
            root: path.join(root, 'public'),
        }).catch(() => {})
        return next()
        // return next()
    }
}
