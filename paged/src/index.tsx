import fs from 'fs'
import { StaticRouter } from 'react-router-dom'
import React from 'react'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import escapeStringRegexp from 'escape-string-regexp'
import memoize from 'micro-memoize'
import { Plugin as PluginType, build } from '@bundless/cli'
import { fileToImportPath, importPathToFile } from '@bundless/cli/dist/utils'
import glob from 'fast-glob'
import { addHook } from 'pirates'
import {
    commonEsbuildOptions,
    generateDefineObject,
    metafileToBundleMap,
    resolvableExtensions,
} from '@bundless/cli/dist/prebundle/esbuild'
import {
    matchRoutes,
    createRoutesFromArray,
    generatePath,
} from 'react-router-dom'
import path = require('path')
import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { osAgnosticPath } from '@bundless/cli/dist/prebundle/support'
import { MahoContext } from './client'

const CLIENT_ENTRY = '_bundless_paged_entry_.jsx'
const ROUTES_ENTRY = '_bundless_paged_routes_.jsx'

export function Plugin({
    clientScriptSrc = '/' + CLIENT_ENTRY,
} = {}): PluginType {
    // in prod the html template uses the output bundle as script
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
        <body>
            <script type="module" src="${clientScriptSrc}"></script>
        </body>
    </html>
    `

    return {
        name: 'paged-plugin',
        setup({ config, onLoad, onResolve, onTransform, pluginsExecutor }) {
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

            // resolve virtual html files
            onResolve({ filter: /.*/ }, async (args) => {
                const routesPaths = await (await getRoutes()).map((x) =>
                    path.posix.join(x.path, 'index.html'),
                )
                // TODO use react router utils instead
                // import {
                //     matchRoutes,
                //     createRoutesFromArray,
                //     generatePath,
                // } from 'react-router-dom'
                const indexPath = args.path.endsWith('.html')
                    ? args.path
                    : path.posix.join(args.path, 'index.html')
                const relativeIndexPath = fileToImportPath(root, indexPath)
                const route = routesPaths.find((x) => x === relativeIndexPath)
                if (route) {
                    return {
                        path: indexPath,
                    }
                }
            })

            // load html paths with html template
            onLoad({ filter: /\.html/ }, async (args) => {
                return { contents: htmlTemplate, loader: 'html' as any }
            })

            onTransform({ filter: /\.html/ }, async (args) => {
                // if (config.platform === 'node') {
                //     return
                // }
                // build the entry for node using build(), run getStaticProps, run renderToString(<App location=req.location} />), inject html
                const ssrOutDir = await path.resolve(root, 'node_dist')
                const entry = path.resolve(root, ROUTES_ENTRY)
                const { bundleMap } = await build({
                    config: {
                        ...config,
                        platform: 'node',
                        entries: [entry],
                        plugins: [Plugin()], // TODO do not run this in ssr mode to not recurse forever?
                    },
                    outDir: ssrOutDir,
                })

                let outputPath = bundleMap[osAgnosticPath(entry, root)]
                if (!outputPath) {
                    throw new Error(
                        `Could not find ssr output for '${entry}', ${JSON.stringify(
                            Object.keys(bundleMap),
                        )}`,
                    )
                }
                outputPath = path.resolve(root, outputPath)

                const { App } = tryRequire(outputPath)
                const url = fileToImportPath(root, args.path)
                const context = { url }
                const prerenderedHtml = renderToString(
                    <App Router={StaticRouter} context={context} />,
                )
                const html = renderToStaticMarkup(
                    <MahoContext.Provider value={context}>
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
                    </MahoContext.Provider>,
                )

                const contents = args.contents.replace(
                    '<body>',
                    `<body>\n${html}`,
                )

                return {
                    contents,
                }
            })

            const getRoutes = memoize(
                async function getRoutes() {
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

            // TODO memoise and invalidate on pages file changes
            onLoad(
                { filter: new RegExp(escapeStringRegexp(ROUTES_ENTRY)) },
                async (args) => {
                    const routes = await getRoutes()
                    return {
                        contents: makeRoutesContent({ root, routes }),
                        loader: 'jsx',
                    }
                },
            )
        },
    }
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
