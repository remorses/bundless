import { Middleware } from 'koa'
import send, { SendOptions } from 'koa-send'

// like koa static but executes other middlewares after serving, needed to transform html afterwards
export function staticServeMiddleware(opts: SendOptions): Middleware {
    opts.index = opts.index || 'index.html'
    return async function serve(ctx, next) {
        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
            return next()
        }
        if (ctx.body) {
            return next()
        }

        try {
            // console.log('try serving ' + ctx.path)
            await send(ctx, ctx.path, opts)
        } catch (err) {
            if (err.status !== 404 && err.code !== 'ENOENT') {
                throw new Error(`Cannot static serve ${ctx.path}: ${err}`)
            }
        }

        await next()
    }
}
