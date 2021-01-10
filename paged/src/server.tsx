import { build, logger, Logger, PluginsExecutor } from '@bundless/cli'
import { Config, defaultConfig } from '@bundless/cli/dist/config'
import { createDevApp } from '@bundless/cli/dist/serve'
import { importPathToFile, osAgnosticPath } from '@bundless/cli/dist/utils'
import { ReactRefreshPlugin } from '@bundless/plugin-react-refresh'
import { Server } from 'http'
import Koa from 'koa'
import koaBody from 'koa-body'
import mount from 'koa-mount'
import koaStatic from 'koa-static'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { matchPath } from 'react-router-dom/'
import { MahoContext } from './client'
import { CLIENT_ENTRY, ROUTES_ENTRY } from './constants'
import { Plugin } from './plugin'
import { getPagesRoutes, getRpcRoutes, rpcPathForFile } from './routes'



export async function createServer({
    isProduction = false,
    root,
    builtAssets = 'client_out',
    ssrOutDir = 'ssr_out',
}) {
    const app = new Koa()
    app.use(koaBody({}))
    const pagesDir = path.resolve(root, 'pages')
    const rpcDir = path.resolve(root, 'rpc')
    let baseConfig: Config = {
        ...defaultConfig,
        server: {
            forcePrebundle: true, // TODO remove this after finish prototyping
        },
        root,
        plugins: [Plugin(), ...(!isProduction ? [ReactRefreshPlugin()] : [])],
    }
    const server = new Server()
    let clientScriptSrc
    let pluginsExecutor: PluginsExecutor

    if (isProduction) {
        const { bundleMap } = await build({
            ...baseConfig,
            build: {
                outDir: builtAssets,
            },
            entries: [CLIENT_ENTRY],
        })
        clientScriptSrc = `/${path.relative(
            builtAssets,
            bundleMap[CLIENT_ENTRY],
        )}`

        app.use(koaStatic(builtAssets, { index: false }))
    } else {
        const {
            app: devApp,
            pluginsExecutor: devPluginsExecutor,
        } = await createDevApp(server, {
            ...baseConfig,
            platform: 'browser',
            entries: [CLIENT_ENTRY],
        })
        pluginsExecutor = devPluginsExecutor
        app.use(mount('/', devApp))
        clientScriptSrc = `/${CLIENT_ENTRY}?namespace=file`
    }

    const ssrLogger = new Logger({ silent: true })
    const ssrEntry = path.resolve(root, ROUTES_ENTRY)

    const { bundleMap, rebuild } = await build({
        ...baseConfig,
        logger: ssrLogger,
        // TODO resolve react and react dom to the user's installed react and react dom
        plugins: [Plugin()],
        entries: [
            ssrEntry, // TODO rebuild cannot add new entries, this means that to add a new rpc file you need to reload the server
            ...(await getRpcRoutes({ rpcDir })).map((x) => x.absolute),
        ],
        platform: 'node',
        build: {
            outDir: ssrOutDir,
        },
        incremental: true,
    })

    // handle rpc calls
    app.use(async (ctx, next) => {
        const rpcRoutes = await getRpcRoutes({
            rpcDir: path.resolve(root, 'rpc'),
        })

        const foundRoute = rpcRoutes.find((route) => {
            const match = matchPath(ctx.path, {
                path: rpcPathForFile({ filePath: route.absolute, root }),
                exact: true,
                strict: false,
            })
            return match
        })

        if (!foundRoute) {
            return next()
        }


        // TODO add watchIgnore option, ignore files in dist directories or rebuild will trigger a reload in dev
        // if (!isProduction) {
        //     logger.log('rebuilding')
        //     await rebuild!()
        // }

        const rpcBundle = bundleMap[osAgnosticPath(foundRoute.absolute, root)]
        if (!rpcBundle) {
            throw new Error(`Cannot find bundle for ${foundRoute.relative}`)
        }

        const imports = tryRequire(path.resolve(root, rpcBundle))

        const rpcFunction = imports.default
        const args = ctx.request.body
        logger.log(`Running rpc function ${foundRoute.absolute}`)
        logger.log(`with arguments ${JSON.stringify(args, null, 4)}`)
        const result = await rpcFunction(args)
        console.log({ result })
        ctx.body = JSON.stringify(result)
        ctx.status = 200
        ctx.type = 'application/json'
    })

    app.use(async (ctx, next) => {
        if (ctx.method !== 'GET' && !ctx.is('html')) return next()

        const routesPaths = await (
            await getPagesRoutes({ pagesDir })
        ).map((x) => path.posix.join(x.path, 'index.html'))
        // TODO use react router utils instead of appending index.html

        const indexPath = ctx.path.endsWith('.html')
            ? ctx.path
            : path.posix.join(ctx.path, 'index.html')

        const routeFound = routesPaths.find((x) => x === indexPath)

        if (!routeFound) {
            return next()
        }

        // on dev rebuild on every refresh
        if (!isProduction) {
            logger.log('rebuilding')
            await rebuild!()
        }

        let outputPath = bundleMap[osAgnosticPath(ssrEntry, root)]
        if (!outputPath) {
            throw new Error(
                `Could not find ssr output for '${ssrEntry}', ${JSON.stringify(
                    Object.keys(bundleMap),
                )}`,
            )
        }
        outputPath = path.resolve(root, outputPath)

        const { App } = tryRequire(outputPath)
        const context = { url: ctx.req.url }
        const prerenderedHtml = renderToString(
            <App Router={StaticRouter} context={context} />,
        )
        const html = renderToStaticMarkup(
            <MahoContext.Provider value={context}>
                <html>
                    <head></head>
                    <body>
                        <script type='module' src={clientScriptSrc}></script>
                        <script
                            dangerouslySetInnerHTML={{
                                __html: `window.INITIAL_STATE=${JSON.stringify({
                                    statusCode: 200,
                                    routeData: {},
                                })}`,
                            }}
                        ></script>
                        <div
                            id='_maho'
                            dangerouslySetInnerHTML={{
                                __html: prerenderedHtml,
                            }}
                        ></div>
                    </body>
                </html>
            </MahoContext.Provider>,
        )

        let fullHtml = `<!DOCTYPE html>\n${html}`
        // use plugins executor to process html and inject react refresh stuff ....
        if (pluginsExecutor) {
            const transformResult = await pluginsExecutor.transform({
                contents: fullHtml,
                path: importPathToFile(root, indexPath),
            })
            if (transformResult) {
                fullHtml = transformResult.contents || ''
            }
        }
        ctx.body = fullHtml
        ctx.status = 200
        ctx.type = 'html'
        return next()
    })

    server.on('request', app.callback())

    server.on('close', () => rebuild && rebuild.dispose())

    return server
}

function tryRequire(p: string) {
    try {
        const cachePath = require.resolve(p)
        delete require.cache[cachePath]

        return require(p)
    } catch (e) {
        throw new Error(`Cannot require '${p}': ${e}`)
    }
}
