import { build, logger, Logger, PluginsExecutor } from '@bundless/cli'
import slash from 'slash'
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
import { getPagesRoutes, getRpcRoutes } from './routes'

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
        prebundle: {
            force: true, // TODO remove this after finish prototyping
        },
        define: {
            'process.browser': 'true',
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
            define: {
                'process.browser': 'true',
            },
            entries: [CLIENT_ENTRY],
        })
        clientScriptSrc = `/${slash(
            path.relative(builtAssets, bundleMap[CLIENT_ENTRY]),
        )}`

        app.use(koaStatic(builtAssets, { index: false }))
    } else {
        const {
            app: devApp,
            pluginsExecutor: devPluginsExecutor,
        } = await createDevApp(server, {
            ...baseConfig,
            platform: 'browser',
            define: {
                'process.browser': 'true',
            },
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
        define: {
            'process.browser': 'false',
        },
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
                path: route.path,
                exact: true,
                strict: true,
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

    // handle html pages
    app.use(async (ctx, next) => {
        if (ctx.method !== 'GET' && !ctx.is('html')) return next()

        const pagesRoutes = await getPagesRoutes({ pagesDir })

        const foundRoute = pagesRoutes.find((route) => {
            const match = matchPath(ctx.path, {
                path: route.path,
                exact: true,
                strict: true,
            })
            if (match) {
                logger.log(`${ctx.path} matched ${route.path}`)
            }
            return match
        })

        if (!foundRoute) {
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
                path: foundRoute.absolute + '.html',
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
