import { logger, Plugin as PluginType } from '@bundless/cli'
import escapeStringRegexp from 'escape-string-regexp'
import path from 'path'
import * as uuid from 'uuid'
import { CLIENT_ENTRY, isJsPage, ROUTES_ENTRY } from './constants'
import {
    getPagesRoutes,
    getRpcRoutes,
    invalidateCache,
    rpcPathForFile,
} from './routes'

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
                        invalidateCache(getPagesRoutes)
                    }
                    const isInsideRpc = !path
                        .relative(rpcDir, filePath)
                        .startsWith('..')
                    if (isInsideRpc && isJsPage(filePath)) {
                        // invalidate routes cache keys
                        invalidateCache(getRpcRoutes)
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
