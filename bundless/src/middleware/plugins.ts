import { FSWatcher } from 'chokidar'
import { Middleware } from 'koa'
import { PluginsExecutor } from '../plugins-executor'
import { importPathToFile, dotdotEncoding, genSourceMapString } from '../utils'

export function pluginsMiddleware({
    root,
    watcher,
    pluginsExecutor,
}: {
    root: string
    watcher: FSWatcher
    pluginsExecutor: PluginsExecutor
}): Middleware {
    return async function pluginsMiddleware(ctx, next) {
        if (
            ctx.query.namespace == null &&
            ctx.req.headers['sec-fetch-dest'] !== 'script'
        ) {
            return next()
        }

        if (ctx.path.startsWith('.')) {
            throw new Error(
                `All import paths should have been rewritten to absolute paths (start with /)\n` +
                    ` make sure import paths for '${ctx.path}' are statically analyzable`,
            )
        }

        const isVirtual = ctx.query.namespace && ctx.query.namespace !== 'file'
        // do not resolve virtual files like node builtins to an absolute path
        const resolvedPath = isVirtual
            ? ctx.path.slice(1) // remove leading /
            : importPathToFile(root, ctx.path)

        // watch files outside root
        if (
            ctx.path.startsWith('/' + dotdotEncoding) &&
            !resolvedPath.includes('node_modules')
        ) {
            watcher.add(resolvedPath)
        }

        const namespace = ctx.query.namespace || 'file'
        const loaded = await pluginsExecutor.load({
            path: resolvedPath,
            namespace,
        })
        if (loaded == null || loaded.contents == null) {
            return next()
        }
        const transformed = await pluginsExecutor.transform({
            path: resolvedPath,
            loader: loaded.loader,
            namespace,
            contents: String(loaded.contents),
        })
        if (transformed == null) {
            return next()
        }

        const sourcemap = transformed.map
            ? genSourceMapString(transformed.map)
            : ''

        ctx.body = transformed.contents + sourcemap
        ctx.status = 200
        ctx.type = 'js'
        return next()
    }
}
