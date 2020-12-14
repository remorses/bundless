import chalk from 'chalk'
import chokidar, { FSWatcher } from 'chokidar'
import deepmerge from 'deepmerge'
import { Server } from 'http'
import Koa, { DefaultContext, DefaultState } from 'koa'
import { listen } from 'listhen'
import path from 'path'
import slash from 'slash'
import WebSocket from 'ws'
import { HMRPayload } from './client/types'
import { Config } from './config'
import {
    DEFAULT_PORT,
    HMR_SERVER_NAME,
    JS_EXTENSIONS,
    WEB_MODULES_PATH,
} from './constants'
import { Graph } from './graph'
import * as middlewares from './middleware'
import { createPluginsExecutor, PluginsExecutor } from './plugin'
import {
    CssPlugin,
    EsbuildTransformPlugin,
    NodeResolvePlugin,
    ResolveSourcemapPlugin,
    RewritePlugin,
    SourcemapPlugin,
} from './plugins'
import { prebundle } from './prebundle'
import { BundleMap } from './prebundle/esbuild'
import { genSourceMapString } from './sourcemaps'
import { isNodeModule, requestToFile } from './utils'

const debug = require('debug')('espack')
export interface ServerPluginContext {
    root: string
    app: Koa
    pluginExecutor: PluginsExecutor
    // server: Server
    watcher: FSWatcher
    server?: Server
    config: Config
    sendHmrMessage: (payload: HMRPayload) => void
    port: number
}

export type ServerMiddleware = (ctx: ServerPluginContext) => void

export async function serve(config: Config) {
    const app = createApp(config)
    const { server, close } = await listen(app.callback(), {
        port: config.port || DEFAULT_PORT,
        showURL: true,
        // open: true,
    })
    app.context.server = server
    const port = server.address()?.['port']
    app.context.port = port
    return { ...server, close }
}

export function createApp(config: Config) {
    config = deepmerge({ root: process.cwd() }, config)
    const { root = process.cwd() } = config

    const app = new Koa<DefaultState, DefaultContext>()

    const watcher = chokidar.watch(root, {
        ignored: ['**/node_modules/**', '**/.git/**'],
        ignoreInitial: true,
        //   ...chokidarWatchOptions
    })

    const graph = new Graph()
    let bundleMap: BundleMap | undefined
    const pluginExecutor = createPluginsExecutor({
        plugins: [
            NodeResolvePlugin({
                resolveOptions: {
                    extensions: [...JS_EXTENSIONS, '.js.map', '.css'],
                },
                async onResolved(resolvedPath) {
                    if (!isNodeModule(resolvedPath)) {
                        return
                    }
                    const relativePath = slash(
                        path.relative(root, resolvedPath),
                    )
                    if (bundleMap && bundleMap[relativePath]) {
                        return bundleMap[relativePath]
                    }
                    // node module path not bundled, rerun bundling
                    const entryPoints = [...Object.keys(graph.nodes)]
                    bundleMap = await prebundle({
                        entryPoints, // TODO get root from graph
                        dest: path.resolve(root, WEB_MODULES_PATH),
                        root: root,
                    })
                    return bundleMap[relativePath]
                    // lock server, start optimization, unlock, send refresh message
                },
            }),
            // NodeModulesPolyfillPlugin(),
            EsbuildTransformPlugin(),
            RewritePlugin(),
            ResolveSourcemapPlugin(),
            SourcemapPlugin(),
            CssPlugin(),
        ],
        config,
        graph,
    })

    const context: ServerPluginContext = {
        root,
        app,
        watcher,
        config,
        pluginExecutor,
        sendHmrMessage: () => {
            throw new Error(`hmr ws client has not started yet`)
        },
        // port is exposed on the context for hmr client connection
        // in case the files are served under a different port
        port: Number(config.port || 3000),
    }

    const pluginsMiddleware: ServerMiddleware = ({ app }) => {
        // attach server context to koa context
        app.use(async (ctx, next) => {
            Object.assign(ctx, context)
            // TODO skip non js code
            if (ctx.path == '/') {
                return next()
            }
            const filePath = requestToFile(root, ctx.path)
            const loaded = await pluginExecutor.load({
                path: filePath,
                namespace: '',
            })
            if (loaded == null || loaded.contents == null) {
                return next()
            }
            const transformed = await pluginExecutor.transform({
                path: filePath,
                loader: loaded.loader,
                contents: String(loaded.contents),
            })
            if (transformed == null) {
                return next()
            }

            const sourcemap = transformed.map
                ? genSourceMapString(transformed.map)
                : ''

            ctx.body = transformed.contents + sourcemap
            ctx.type = 'js' // TODO get content type from loader
        })
    }
    const hmrMiddleware: ServerMiddleware = ({ app }) => {
        // attach server context to koa context
        const wss = new WebSocket.Server({ noServer: true })
        let done = false
        app.use((_, next) => {
            if (done) {
                return next()
            }

            app.context.server.on('upgrade', (req, socket, head) => {
                if (req.headers['sec-websocket-protocol'] === HMR_SERVER_NAME) {
                    wss.handleUpgrade(req, socket, head, (ws) => {
                        wss.emit('connection', ws, req)
                    })
                }
            })

            wss.on('connection', (socket) => {
                debug('ws client connected')
                socket.send(JSON.stringify({ type: 'connected' }))
            })

            wss.on('error', (e: Error & { code: string }) => {
                if (e.code !== 'EADDRINUSE') {
                    console.error(chalk.red(`[vite] WebSocket server error:`))
                    console.error(e)
                }
            })

            context.sendHmrMessage = (payload: HMRPayload) => {
                const stringified = JSON.stringify(payload, null, 2)
                debug(`update: ${stringified}`)

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(stringified)
                    }
                })
            }
            done = true
            return next()
        })
    }

    const serverMiddleware = [
        hmrMiddleware,
        middlewares.clientMiddleware,
        middlewares.pluginAssetsMiddleware,
        pluginsMiddleware,
        middlewares.serveStaticMiddleware,
    ]
    for (const middleware of serverMiddleware) {
        middleware(context)
    }

    // cors
    if (config.cors) {
        app.use(
            require('@koa/cors')(
                typeof config.cors === 'boolean' ? {} : config.cors,
            ),
        )
    }

    return app
}
