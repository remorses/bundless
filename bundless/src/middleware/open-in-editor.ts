import { logger } from '..'
import launchEditor from 'launch-editor'
import { importPathToFile } from '../utils'
import { Middleware } from 'koa'

export function openInEditorMiddleware({ root }): Middleware {
    return function(ctx, next) {
        if (ctx.path !== '/__open-in-editor') {
            return next()
        }
        const { file = '' } = ctx.query || {}
        if (!file) {
            ctx.res.statusCode = 500
            ctx.body = `launch-editor-middleware: required query param "file" is missing.`
            return
        }
        const realPath = file.startsWith('/')
            ? file
            : importPathToFile(root, file)

        logger.debug(`Opening editor for ${file} at ${realPath}`)
        launchEditor(realPath)
        ctx.res.statusCode = 200
        ctx.body = `Opened ${realPath}`
    }
}
