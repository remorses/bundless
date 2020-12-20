import { Middleware } from 'koa'
import { ServerMiddleware } from '../serve'
import { isImportRequest, isStaticAsset } from '../utils'

export function pluginAssetsMiddleware(): Middleware {
    return async (ctx, next) => {
        if (isStaticAsset(ctx.path) && isImportRequest(ctx)) {
            ctx.type = 'js'
            ctx.body = `export default ${JSON.stringify(ctx.path)}`
            return
        }
        return next()
    }
}
