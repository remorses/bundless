import { listen } from 'listhen'
import { DEFAULT_PORT } from './constants'
import { FSWatcher } from 'chokidar'
import { Server } from 'http'
import { pluginAssetsPlugin, serveStaticPlugin } from './middleware'
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

import Koa, { DefaultState, DefaultContext } from 'koa'
import chokidar from 'chokidar'
import { createPluginsExecutor, PluginsExecutor } from './plugin'
import { Config } from './config'
import { requestToFile } from './utils'
import { genSourceMapString } from './sourcemaps'

export function createHandler(config: Config) {
    const { root = process.cwd() } = config

    const app = new Koa<DefaultState, DefaultContext>()
    const watcher = chokidar.watch(root, {
        ignored: ['**/node_modules/**', '**/.git/**'],
        ignoreInitial: true,
        //   ...chokidarWatchOptions
    })

    const pluginExecutor = createPluginsExecutor({ plugins: [], config })

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
        // TODO if type is not js, only load imported files (must have an ?import query)
        const filePath = requestToFile(root, ctx.path)
        const loaded = await pluginExecutor.load({
            path: filePath,
            namespace: '',
        })
        if (loaded == null || loaded.contents == null) {
            return
        }
        const transformed = await pluginExecutor.transform({
            path: filePath,
            // TODO add loader as arg
            contents: String(loaded.contents),
        })
        if (transformed == null) {
            return
        }

        const sourcemap = transformed.map
            ? genSourceMapString(transformed.map)
            : ''

        ctx.body = transformed.code + sourcemap
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
