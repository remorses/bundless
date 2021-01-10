import {
    build,
    Logger,
    Plugin as PluginType,
    PluginsExecutor,
} from '@bundless/cli'
import koaBody from 'koa-body'
import { matchPath, generatePath } from 'react-router-dom/'
import * as uuid from 'uuid'
import { Config, defaultConfig } from '@bundless/cli/dist/config'
import { ReactRefreshPlugin } from '@bundless/plugin-react-refresh'
import { createDevApp } from '@bundless/cli/dist/serve'
import { importPathToFile, osAgnosticPath } from '@bundless/cli/dist/utils'
import escapeStringRegexp from 'escape-string-regexp'
import glob from 'fast-glob'
import { Server } from 'http'
import Koa from 'koa'
import mount from 'koa-mount'
import koaStatic from 'koa-static'
import memoize from 'micro-memoize'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { resolveAsync } from '@esbuild-plugins/all'
import { StaticRouter } from 'react-router-dom'
import { MahoContext } from './client'
import picomatch from 'picomatch'
import { file } from '@babel/types'

const CLIENT_ENTRY = '_bundless_paged_entry_.jsx'
const ROUTES_ENTRY = '_bundless_paged_routes_.jsx'
const jsGlob = '**/*.{ts,tsx,js,jsx}'
const isJsPage = picomatch(jsGlob)

const logger = new Logger({ prefix: '[paged] ' })

export function Plugin({} = {}): PluginType {
    const originalRpcFiles = {}
    return {
        name: 'paged-plugin',
        setup({
            onLoad,
            onResolve,
            onTransform,
            ctx: { root, watcher, isBuild, config },
        }) {
            const pagesDir = path.resolve(root, 'pages')
            const rpcDir = path.resolve(root, 'rpc')
            const isClient = config.platform === 'browser'
            onResolve(
                { filter: new RegExp(escapeStringRegexp(CLIENT_ENTRY)) },
                (args) => {
                    return {
                        path: path.resolve(root, CLIENT_ENTRY),
                    }
                },
            )

            if (isClient) {
                // TODO more robust regex for virtual rpc files
                const rpcPrefix = '__rpc__'

                onResolve({ filter: new RegExp(rpcPrefix) }, (args) => {
                    logger.log(`resolving rpc ${args.path}`)
                    return {
                        path: path.resolve(root, 'original_rpc', args.path),
                    }
                })

                onLoad({ filter: new RegExp(rpcPrefix) }, (args) => {
                    logger.log(`loading rpc ${args.path}`)
                    const basename = path.basename(args.path)
                    const originalCode = originalRpcFiles[basename]
                    if (!originalCode) {
                        return
                    }
                    return {
                        contents: originalCode,
                        loader: 'default',
                    }
                })

                onTransform({ filter: /rpc/ }, async (args) => {
                    const isRpcFile = !path
                        .relative(rpcDir, args.path)
                        .startsWith('..')

                    if (!isRpcFile) {
                        return
                    }
                    const originalCodeFilename =
                        rpcPrefix + uuid.v4() + path.extname(args.path)
                    originalRpcFiles[originalCodeFilename] = args.contents
                    logger.log(
                        `transforming ${args.path} and importing original code from ${originalCodeFilename}`,
                    )
                    // TODO pass right path for rpc function
                    const contents = rpcFunctionTemplate({
                        originalCodeFilename,
                        root,
                        rpcPublicPath: rpcPathForFile({
                            filePath: args.path,
                            root,
                        }),
                    })
                    return {
                        contents,
                        loader: 'js',
                    }
                })
            }

            onLoad(
                { filter: new RegExp(escapeStringRegexp(CLIENT_ENTRY)) },
                (args) => {
                    return {
                        contents: clientEntryContent,
                        resolveDir: root,
                        loader: 'jsx',
                    }
                },
            )

            onResolve(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                (args) => {
                    return {
                        path: path.resolve(root, ROUTES_ENTRY),
                    }
                },
            )

            if (watcher && !isBuild) {
                function onChange(filePath) {
                    // filePath = path.resolve(filePath)
                    const isInsidePages = !path
                        .relative(pagesDir, filePath)
                        .startsWith('..')
                    if (isInsidePages && isJsPage(filePath)) {
                        // invalidate routes cache keys
                        getPagesRoutes.cache.keys.length = 0
                        getPagesRoutes.cache.values.length = 0
                    }
                    const isInsideRpc = !path
                        .relative(rpcDir, filePath)
                        .startsWith('..')
                    if (isInsideRpc && isJsPage(filePath)) {
                        // invalidate routes cache keys
                        getRpcRoutes.cache.keys.length = 0
                        getRpcRoutes.cache.values.length = 0
                    }
                }
                // TODO reserach what chokidar events means, i should probably add add, remove, ...
                watcher.on('change', onChange)
            }

            onLoad(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                async (args) => {
                    const routes = await getPagesRoutes({
                        pagesDir,
                    })
                    return {
                        contents: makeRoutesContent({ root, routes }),
                        resolveDir: root,
                        loader: 'jsx',
                    }
                },
            )
        },
    }
}

function rpcFunctionTemplate({ root, originalCodeFilename, rpcPublicPath }) {
    return `
import rpcFunction from '${originalCodeFilename}'

export default async function wrapper(arg) {
    const res = await fetch('${rpcPublicPath}', {
        method: 'POST',
        body: JSON.stringify(arg),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const json = await res.json()
    return json
}
`
}

const getRpcRoutes = memoize(
    async function getRpcRoutes({
        rpcDir,
    }): Promise<{ relative: string; absolute: string }[]> {
        const files = new Set(
            await glob(jsGlob, {
                cwd: rpcDir,
            }),
        )

        return [...files].map((relative) => {
            return {
                relative,
                absolute: path.resolve(rpcDir, relative),
            }
        })
    },
    { isPromise: true },
)

const getPagesRoutes = memoize(
    async function getRoutes({ pagesDir }) {
        const files = new Set(
            await glob(jsGlob, {
                cwd: pagesDir,
            }),
        )

        const routes = [...files].map((file) => {
            const filename = `/${file
                .replace(/\.[a-z]+$/, '')
                .replace(/^index$/, '')
                .replace(/\/index$/, '')
                .replace(/\[\.\.\.([^\]]+)\]/g, '*')
                .replace(/\[([^\]]+)\]/g, ':$1')}`
            return {
                path: filename,
                absolute: path.join(pagesDir, file),
                relative: file,
                name: file.replace(/[^a-zA-Z0-9]/g, '_'),
            }
        })
        return routes
    },
    { isPromise: true },
)

export async function createServer({
    isProduction = false,
    root,
    builtAssets = 'client_out',
    ssrOutDir = 'ssr_out',
    rpcOutDir = 'rpc_out',
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

        if (!isProduction) {
            logger.log('rebuilding')
            await rebuild!()
        }

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

const clientEntryContent = `
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { App } from './${ROUTES_ENTRY}'

const state = window.INITIAL_STATE

ReactDOM.unstable_createRoot(document.getElementById('_maho'))
    .render(<App 
    Router={BrowserRouter}
    context={{ statusCode: state.statusCode, url: location.href, routeData: state.routeData }} />)
`

const makeRoutesContent = ({ routes, root }) => `
import React from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import { useMahoContext, MahoContext } from '@bundless/plugin-react-paged/src/client'

const Suspense = process.browser ? React.Suspense : ({children}) => children

${routes
    .map((route) => {
        return `
        let Route_${route.name}
        let load_${route.name}
        if (process.browser) {
            Route_${
                route.name
            } = React.lazy(() => import("./${path.posix.relative(
            root,
            route.absolute,
        )}"))
        } else {
            const res = require("./${path.posix.relative(
                root,
                route.absolute,
            )}")
            Route_${route.name} = res.default
            load_${route.name} = res.load
        }
        `
    })
    .join('\n')}



const NotFound = () => {
    const context = useMahoContext()
    if (context) {
        context.statusCode = 404
    }
    return <div>404</div>
}

export const loadFunctions = process.browser ? undefined : [
    ${routes
        .map((route) => {
            return `{
            path: "${route.path}",
            load: load_${route.name}
        }`
        })
        .join(',\n')}
]

export const Routes = () => {
    if (process.browser) {
        const location = useLocation()
        React.useEffect(() => {
            const state = window.INITIAL_STATE
            state.revalidateOnMount = true
        }, [location.pathname])
    }
    return <Switch>
        ${routes
            .map((route) => {
                return `<Route path="${route.path}"
                    component={Route_${route.name}}
                />`
            })
            .join('\n')}
        <Route path="*" component={NotFound} />
    </Switch>
}

class ErrorBoundary extends React.Component {
    state = {error: null}
    static getDerivedStateFromError(error) {
        return {error}
    }
    componentDidCatch() {
        // log the error to the server
    }
    tryAgain = () => this.setState({error: null})
    render() {
        return this.state.error ? (
            <div>
                There was an error. <button onClick={this.tryAgain}>try again</button>
                <pre style={{whiteSpace: 'normal'}}>{this.state.error.message}</pre>
            </div>
        ) : (
            this.props.children
        )
    }
}

export const App = ({ context, Router }) => {
    return <MahoContext.Provider value={context}>
        <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
                <Router location={context.url}>
                    <Routes />
                </Router>
            </Suspense>
        </ErrorBoundary>
    </MahoContext.Provider>
}
`

function rpcPathForFile({ filePath, root }) {
    if (!path.isAbsolute(filePath)) {
        throw new Error(`rpcPathForFile needs absolute paths`)
    }
    const relative = path.posix.relative(root, filePath).replace(/\..+$/, '')
    return '/' + relative
}
