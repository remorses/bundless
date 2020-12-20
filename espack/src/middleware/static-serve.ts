import { Middleware } from 'koa'
import send, { SendOptions } from 'koa-send'

export function staticServeMiddleware(opts: SendOptions): Middleware {
    opts.index = opts.index || 'index.html'
    return async function serve(ctx, next) {
        if (ctx.method === 'HEAD' || ctx.method === 'GET') {
            try {
                await send(ctx, ctx.path, opts)
            } catch (err) {
                if (err.status !== 404) {
                    throw err
                }
            }
        }

        await next()
    }
}
