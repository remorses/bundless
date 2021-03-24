import { Middleware } from 'koa'
import send, { SendOptions } from 'koa-send'
import { logger } from '../logger'

// like koa static but executes other middlewares after serving, needed to transform html afterwards
export function staticServeMiddleware(opts: SendOptions): Middleware {
    opts.index = opts.index || 'index.html'
    opts.hidden = opts.hidden || true
    const cacheOptions: send.SendOptions = {
        maxAge: 1000 * 60 * 60,
        immutable: true,
    }
    return async function serve(ctx, next) {
        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
            return next()
        }
        if (ctx.body) {
            return next()
        }

        const isDep = ctx.path.includes('.bundless/web_modules')
        try {
            logger.debug('Statically serving ' + ctx.path)
            await send(ctx, ctx.path, { ...opts, ...(isDep && cacheOptions) })
        } catch (err) {
            if (err.status !== 404 && err.code !== 'ENOENT') {
                throw new Error(`Cannot static serve ${ctx.path}: ${err}`)
            }
        }

        await next()
    }
}
