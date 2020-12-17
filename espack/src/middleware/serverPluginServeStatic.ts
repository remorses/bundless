import fs from 'fs'
import mime from 'mime-types'
import path from 'path'
import chalk from 'chalk'
import { ServerMiddleware } from '../serve'
import { isStaticAsset, readFile, importPathToFile } from '../utils'

const send = require('koa-send')
const debug = require('debug')('vite:history')

export const seenUrls = new Set()

export const serveStaticMiddleware: ServerMiddleware = ({ root, app }) => {
    app.use(async (ctx, next) => {
        // short circuit requests that have already been explicitly handled
        if (ctx.body || ctx.status !== 404) {
            return
        }

        // warn non-root references to assets under /public/
        if (ctx.path.startsWith('/public/') && isStaticAsset(ctx.path)) {
            console.error(
                chalk.yellow(
                    `files in the public directory are served at the root path.\n` +
                        `  ${chalk.blue(
                            ctx.path,
                        )} should be changed to ${chalk.blue(
                            ctx.path.replace(/^\/public\//, '/'),
                        )}.`,
                ),
            )
        }

        // handle possible user request -> file aliases
        const expectsHtml =
            ctx.headers.accept && ctx.headers.accept.includes('text/html')
        if (!expectsHtml) {
            const filePath = importPathToFile(root, ctx.path)
            if (
                filePath !== ctx.path &&
                fs.existsSync(filePath) &&
                fs.statSync(filePath).isFile()
            ) {
                ctx.body = await readFile(filePath)
                ctx.type =
                    mime.lookup(path.extname(filePath)) ||
                    'application/octet-stream'
                ctx.status = 200
            }
        }

        await next()

        // the first request to the server should never 304
        if (seenUrls.has(ctx.url) && ctx.fresh) {
            ctx.status = 304
        }
        seenUrls.add(ctx.url)
    })

    app.use(require('koa-etag')())
    app.use(require('koa-static')(root))
    app.use(require('koa-static')(path.join(root, 'public')))

    // history API fallback
    app.use(async (ctx, next) => {
        if (ctx.status !== 404) {
            return next()
        }

        if (ctx.method !== 'GET') {
            debug(`not redirecting ${ctx.url} (not GET)`)
            return next()
        }

        const accept = ctx.headers && ctx.headers.accept
        if (typeof accept !== 'string') {
            debug(`not redirecting ${ctx.url} (no headers.accept)`)
            return next()
        }

        if (accept.includes('application/json')) {
            debug(`not redirecting ${ctx.url} (json)`)
            return next()
        }

        if (!accept.includes('text/html')) {
            debug(`not redirecting ${ctx.url} (not accepting html)`)
            return next()
        }

        debug(`redirecting ${ctx.url} to /index.html`)
        try {
            await send(ctx, `index.html`, { root })
        } catch (e) {
            ctx.url = '/index.html'
            ctx.status = 404
            return next()
        }
    })
}
