import {
    build,
    Logger,
    Plugin as PluginType,
    PluginsExecutor,
} from '@bundless/cli'
import { defaultConfig } from '@bundless/cli/dist/config'
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
import { StaticRouter } from 'react-router-dom'
import { MahoContext } from './client'

const CLIENT_ENTRY = '_bundless_paged_entry_.jsx'
const ROUTES_ENTRY = '_bundless_paged_routes_.jsx'
const pageGlobs = ['**/*.{ts,tsx,js,jsx}']

export function Plugin({} = {}): PluginType {
    return {
        name: 'paged-plugin',
        setup({ onLoad, onResolve, ctx: { root } }) {
            const pagesDir = path.resolve(root, 'pages')

            onResolve(
                { filter: new RegExp(escapeStringRegexp(CLIENT_ENTRY)) },
                (args) => {
                    return {
                        path: path.resolve(root, CLIENT_ENTRY),
                    }
                },
            )

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

            // TODO memoise and invalidate on pages file changes
            onLoad(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                async (args) => {
                    const routes = await getRoutes({ pageGlobs, pagesDir })
                    return {
                        contents: makeRoutesContent({ root, routes }),
                        loader: 'jsx',
                    }
                },
            )
        },
    }
}

const getRoutes = memoize(
    async function getRoutes({ pageGlobs, pagesDir }) {
        const files = new Set(
            await glob(pageGlobs, {
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
}) {
    const app = new Koa()
    const pagesDir = path.resolve(root, 'pages')
    let baseConfig = {
        ...defaultConfig,
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

    // TODO incremental ssr builds
    const { bundleMap } = await build({
        ...baseConfig,
        logger: ssrLogger,
        plugins: [Plugin()],
        entries: [ssrEntry],
        platform: 'node',
        build: {
            outDir: ssrOutDir,
        },
    })

    let outputPath = bundleMap[osAgnosticPath(ssrEntry, root)]
    if (!outputPath) {
        throw new Error(
            `Could not find ssr output for '${ssrEntry}', ${JSON.stringify(
                Object.keys(bundleMap),
            )}`,
        )
    }
    outputPath = path.resolve(root, outputPath)

    app.use(async (ctx, next) => {
        if (ctx.method !== 'GET' && !ctx.is('html')) return next()

        const routesPaths = await (
            await getRoutes({ pageGlobs, pagesDir })
        ).map((x) => path.posix.join(x.path, 'index.html'))
        // TODO use react router utils instead
        // import {
        //     matchRoutes,
        //     createRoutesFromArray,
        //     generatePath,
        // } from 'react-router-dom'
        const indexPath = ctx.path.endsWith('.html')
            ? ctx.path
            : path.posix.join(ctx.path, 'index.html')

        const routeFound = routesPaths.find((x) => x === indexPath)

        if (!routeFound) {
            return next()
        }

        // TODO do incremental rebuilds
        // on dev rebuild on every refresh
        if (!isProduction) {
            await build({
                ...baseConfig,
                logger: ssrLogger,
                entries: [path.resolve(root, ROUTES_ENTRY)],
                platform: 'node',
                build: {
                    outDir: ssrOutDir,
                },
            })
        }

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

    return server
}

function tryRequire(p: string) {
    try {
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
