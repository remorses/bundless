import chokidar, { FSWatcher } from 'chokidar'
import deepmerge from 'deepmerge'
import Koa, { DefaultContext, DefaultState } from 'koa'
import { listen } from 'listhen'
import path from 'path'
import slash from 'slash'
import { Config } from './config'
import { DEFAULT_PORT, JS_EXTENSIONS, WEB_MODULES_PATH } from './constants'
import { Graph } from './graph'
import * as middlewares from './middleware'
import { createPluginsExecutor, PluginsExecutor } from './plugin'
import {
    CssPlugin,
    EsbuildTransformPlugin,
    NodeResolvePlugin,
    RewritePlugin,
    SourcemapPlugin,
} from './plugins'
import { prebundle } from './prebundle'
import { BundleMap } from './prebundle/esbuild'
import { genSourceMapString } from './sourcemaps'
import { isNodeModule, requestToFile } from './utils'

export interface ServerPluginContext {
    root: string
    app: Koa
    pluginExecutor: PluginsExecutor
    // server: Server
    watcher: FSWatcher
    config: Config
    port: number
}

export type ServerMiddleware = (ctx: ServerPluginContext) => void

export async function serve(config) {
    const handler = createHandler(config)
    const { server } = await listen(handler, {
        port: config.port || DEFAULT_PORT,
        showURL: true,
    })
    return server
}

export function createHandler(config: Config) {
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
                resolveOptions: { extensions: [...JS_EXTENSIONS, '.css'] },
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
        // port is exposed on the context for hmr client connection
        // in case the files are served under a different port
        port: config.port || 3000,
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

    const serverMiddleware = [
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

    return app.callback()
}
