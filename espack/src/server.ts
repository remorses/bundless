import { listen } from 'listhen'
import Koa, { DefaultState, DefaultContext } from 'koa'
import chokidar from 'chokidar'
import { createPluginsExecutor } from './plugin'

export function createHandler(config) {
    const { root = process.cwd() } = config

    const app = new Koa<DefaultState, DefaultContext>()
    const watcher = chokidar.watch(root, {
        ignored: ['**/node_modules/**', '**/.git/**'],
        ignoreInitial: true,
        //   ...chokidarWatchOptions
    })

    const context = {
        root,
        app,
        watcher,
        config,
        // port is exposed on the context for hmr client connection
        // in case the files are served under a different port
        port: config.port || 3000,
    }

    const pluginExecutor = createPluginsExecutor({ plugins: [] })

    // attach server context to koa context
    app.use((ctx, next) => {
        Object.assign(ctx, context)
        
        return next()
    })

    // cors
    if (config.cors) {
        app.use(
            require('@koa/cors')(
                typeof config.cors === 'boolean' ? {} : config.cors,
            ),
        )
    }
}
