import { logger } from '..'
import fs from 'fs'
import launchEditor from 'launch-editor'
import { importPathToFile } from '../utils'
import { Middleware } from 'koa'

const fileLocationRegex = /(:\d+:\d+)$/

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

        let realPath = fs.existsSync(file.replace(fileLocationRegex, '')) ? file : importPathToFile(root, file)

        logger.log(`Opening editor at ${realPath}`)
        launchEditor(realPath)
        ctx.res.statusCode = 200
        ctx.body = `Opened ${realPath}`
    }
}
