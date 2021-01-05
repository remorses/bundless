import { logger } from '..'
import launchEditor from 'launch-editor'
import { importPathToFile } from '../utils'

export function openInEditorMiddleware({ root }) {
    return function(ctx, next) {
        if (ctx.path !== '/__open-in-editor') {
            return next()
        }
        const { file = '' } = ctx.query || {}
        if (!file) {
            ctx.res.statusCode = 500
            ctx.res.end(
                `launch-editor-middleware: required query param "file" is missing.`,
            )
            return
        }
        const realPath = file.startsWith('/')
            ? file
            : importPathToFile(root, file)

        logger.debug(`Opening editor for ${file} at ${realPath}`)
        launchEditor(realPath)
    }
}
