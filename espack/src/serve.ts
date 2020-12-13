import { listen } from 'listhen'
import { DEFAULT_PORT, WEB_MODULES_PATH } from './constants'
import { FSWatcher } from 'chokidar'
import { Server } from 'http'
import { pluginAssetsPlugin, serveStaticPlugin } from './middleware'
import {
    EsbuildTransformPlugin,
    SourcemapPlugin,
    RewritePlugin,
    NodeResolvePlugin,
    NodeModulesPolyfillPlugin,
} from './plugins'

import Koa, { DefaultState, DefaultContext } from 'koa'
import chokidar from 'chokidar'
import { createPluginsExecutor, PluginsExecutor } from './plugin'
import { Config } from './config'
import { isNodeModule, requestToFile } from './utils'
import { genSourceMapString } from './sourcemaps'
import { Graph } from './graph'
import deepmerge from 'deepmerge'
import { prebundle } from './prebundle'
import path from 'path'
import { BundleMap } from './prebundle/esbuild'
import slash from 'slash'

export interface ServerPluginContext {
    root: string
    app: Koa
    pluginExecutor: PluginsExecutor
    // server: Server
    watcher: FSWatcher
    config: Config
    port: number
}

export type ServerPlugin = (ctx: ServerPluginContext) => void

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
                    console.log({ entryPoints })
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
        return next()
    })

    const serverMiddleware = [pluginAssetsPlugin, serveStaticPlugin]
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
