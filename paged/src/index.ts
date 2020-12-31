import fs from 'fs'
import escapeStringRegexp from 'escape-string-regexp'
import memoize from 'micro-memoize'
import { Plugin, logger } from '@bundless/cli'
import glob from 'fast-glob'
import {
    matchRoutes,
    createRoutesFromArray,
    generatePath,
} from 'react-router-dom'
import path = require('path')
import { NodeResolvePlugin } from '@esbuild-plugins/all'

const CLIENT_ENTRY = '_bundless_paged_entry_.jsx'
const ROUTES_ENTRY = '_bundless_paged_routes_.jsx'

const namespace = 'paged-namespace'

export function Plugin(): Plugin {
    return {
        name: 'paged-plugin',
        setup({ config, onLoad, onResolve, onTransform }) {
            const root = config.root!
            const pagesDir = path.resolve(root, 'pages')

            // NodeResolvePlugin({ namespace, extensions: ['.js'] }).setup({ onLoad() {}, onResolve })

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
                    args.path
                    return {
                        contents: clientEntryContent,
                        loader: 'jsx',
                    }
                },
            )
            const pageGlobs = ['**/*.{ts,tsx,js,jsx}']

            onResolve(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                (args) => {
                    return {
                        path: path.resolve(root, ROUTES_ENTRY),
                    }
                },
            )

            onTransform({ filter: /\.html/ }, (args) => {
                const script = `
                    <script>
                    window.INITIAL_STATE = ${JSON.stringify({
                        statusCode: 200,
                        routeData: {},
                    })}
                    </script>
                `
                const contents = args.contents.replace(
                    '<body>',
                    `<body>\n${script}`,
                )
                return {
                    contents,
                }
            })

            // TODO memoise and invalidate on pages file changes
            onLoad(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                async (args) => {
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
                    return {
                        contents: makeRoutesContent({ root, routes }),
                        loader: 'jsx',
                    }
                },
            )
        },
    }
}

const clientEntryContent = `
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { App } from './${ROUTES_ENTRY}'

const state = window.INITIAL_STATE

ReactDOM.unstable_createRoot(document.getElementById('root'))
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
                <Router>
                    <Routes />
                </Router>
            </Suspense>
        </ErrorBoundary>
    </MahoContext.Provider>
}
`
