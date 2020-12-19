import { ServerMiddleware } from '../serve'
import { isImportRequest, isStaticAsset } from '../utils'

export const pluginAssetsMiddleware: ServerMiddleware = ({ app }) => {
    app.use(async (ctx, next) => {
        if (isStaticAsset(ctx.path) && isImportRequest(ctx)) {
            ctx.type = 'js'
            ctx.body = `export default ${JSON.stringify(ctx.path)}`
            return
        }
        return next()
    })
}
