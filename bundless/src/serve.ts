import chalk from 'chalk'
import chokidar, { FSWatcher } from 'chokidar'
import { createHash } from 'crypto'
import deepmerge from 'deepmerge'
import { once } from 'events'
import findUp from 'find-up'
import fs from 'fs-extra'
import { getPort } from 'get-port-please'
import { createServer, Server } from 'http'
import Koa, { DefaultContext, DefaultState, Middleware } from 'koa'
import etagMiddleware from 'koa-etag'
import path from 'path'
import { Node } from 'posthtml'
import slash from 'slash'
import { promisify } from 'util'
import WebSocket from 'ws'
import { HMRPayload } from './client/types'
import { Config, defaultConfig, getEntries } from './config'
import {
    BUNDLE_MAP_PATH,
    DEFAULT_PORT,
    HMR_SERVER_NAME,
    importableAssets,
    JS_EXTENSIONS,
    MAIN_FIELDS,
    showGraph,
    WEB_MODULES_PATH,
} from './constants'
import { HmrGraph } from './hmr-graph'
import { logger } from './logger'
import * as middlewares from './middleware'
import * as plugins from './plugins'
import { PluginsExecutor } from './plugins-executor'
import { prebundle } from './prebundle'
import { BundleMap } from './prebundle/esbuild'
import { isUrl } from './prebundle/support'
import {
    appendQuery,
    dotdotEncoding,
    importPathToFile,
    isEmpty,
    Lock,
    needsPrebundle,
    parseWithQuery,
    prepareError,
} from './utils'
import { genSourceMapString } from './utils/sourcemaps'

process.env.NODE_ENV = 'development'

export interface ServerPluginContext {
    root: string
    app: Koa
    graph: HmrGraph
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
    config = deepmerge(defaultConfig, config)
    const app = await createDevApp(config)
    const server = createServer(app.callback())
    const port = await getPort(config.server?.port || DEFAULT_PORT)

    if (config.server?.port && Number(port) !== Number(config.server?.port)) {
        logger.warn(
            `Using port ${port} because ${config.server?.port} is already in use`,
        )
    }
    await promisify(server.listen.bind(server) as any)(port)

    logger.log(
        `> listening on ${chalk.cyan.underline(`http://localhost:${port}`)}`,
    )

    app.context.server = server
    app.emit('listening')

    app.context.port = port
    config.server = { ...config.server, port }
    async function close() {
        app.emit('close')
        await once(app, 'closed')
        await server.close()
    }
    return {
        ...server,
        close,
    }
}

export const onResolveLock = new Lock()

export async function createDevApp(config: Config) {
    if (!config.root) {
        config.root = process.cwd()
    }
    const { root = '' } = config

    const app = new Koa<DefaultState, DefaultContext>()

    const graph = new HmrGraph({ root })

    const executorCtx = { config, isBuild: false, graph, root }

    const pluginsExecutor = new PluginsExecutor({
        ctx: executorCtx,
        isProfiling: config.profile,
        plugins: [
            // TODO resolve data: imports, rollup emits imports with data: ...
            plugins.HtmlResolverPlugin(),
            plugins.UrlResolverPlugin(), // resolves urls with queries
            plugins.HmrClientPlugin({ getPort: () => app.context.port }),
            // NodeResolvePlugin must be called first, to not skip prebundling
            plugins.NodeResolvePlugin({
                name: 'node-resolve',
                mainFields: MAIN_FIELDS,
                extensions: [...JS_EXTENSIONS],
                onResolved,
            }),
            plugins.AssetsPlugin({ extensions: importableAssets }),
            plugins.NodeModulesPolyfillPlugin({ namespace: 'node-builtins' }),
            plugins.EsbuildTransformPlugin(),
            plugins.CssPlugin(),
            plugins.JSONPlugin(),
            plugins.ResolveSourcemapPlugin(),
            ...(config.plugins || []), // TODO where should i put plugins? i should let user override onResolve, but i should also run rewrite on user outputs
            plugins.RewritePlugin(),
            plugins.HtmlTransformUrlsPlugin({
                transforms: [rewriteScriptUrlsTransform],
            }),
        ].map((plugin) => ({
            ...plugin,
            name: 'serve-' + plugin.name,
        })),
    })

    const bundleMapCachePath = path.resolve(
        root,
        WEB_MODULES_PATH,
        BUNDLE_MAP_PATH,
    )
    const hashPath = path.resolve(root, WEB_MODULES_PATH, 'deps_hash')

    const depsHash = await getDepsHash(root)
    let prevHash = await fs
        .readFile(hashPath)
        .catch(() => '')
        .then((x) => x.toString().trim())
    const isHashDifferent = !depsHash || !prevHash || prevHash !== depsHash

    if (config.server?.forcePrebundle || isHashDifferent) {
        if (isHashDifferent) {
            logger.log(`Dependencies changed, removing ${WEB_MODULES_PATH}`)
            logger.debug('isHashDifferent', isHashDifferent, prevHash, depsHash)
        }
        await fs.remove(path.resolve(root, WEB_MODULES_PATH))
    }

    let bundleMap: BundleMap = await fs
        .readJSON(bundleMapCachePath)
        .catch(() => {
            return {}
        })

    if (isEmpty(bundleMap)) {
        logger.log(
            `${BUNDLE_MAP_PATH} is empty: Prebundling modules in '${WEB_MODULES_PATH}'`,
        )
        bundleMap = await prebundle({
            entryPoints: await getEntries(pluginsExecutor, config),
            filter: (p) => needsPrebundle(config, p),
            dest: path.resolve(root, WEB_MODULES_PATH),
            plugins: config.plugins || [],
            root,
        })
        await updateHash(hashPath, depsHash)
    }

    async function onResolved(resolvedPath: string, importer: string) {
        try {
            // lock browser requests until not prebundled
            await onResolveLock.wait()
            if (!needsPrebundle(config, resolvedPath)) {
                return
            }
            const relativePath = slash(
                path.relative(root, resolvedPath),
            ).replace('$$virtual', 'virtual')
            if (bundleMap && bundleMap[relativePath]) {
                const webBundle = bundleMap[relativePath]
                return path.resolve(root, webBundle!)
            }

            onResolveLock.lock()
            logger.log(
                `Found still not bundled module, running prebundle phase:`,
            )
            logger.log(`'${relativePath}' imported by '${importer}'`)
            context.sendHmrMessage({
                type: 'overlay-info-open',
                info: {
                    message: `Prebundling dependencies`,
                    showSpinner: true,
                },
            })
            // node module path not bundled, rerun bundling
            const entryPoints = await getEntries(pluginsExecutor, config)
            bundleMap = await prebundle({
                entryPoints,
                filter: (p) => needsPrebundle(config, p),
                dest: path.resolve(root, WEB_MODULES_PATH),
                plugins: new PluginsExecutor({
                    ctx: executorCtx,
                    plugins: config.plugins || [],
                }).esbuildPlugins(),
                root,
            }).catch((e) => {
                context.sendHmrMessage({
                    type: 'overlay-info-close',
                })
                context.sendHmrMessage({
                    type: 'overlay-error',
                    err: prepareError(e),
                })
                throw e
            })
            context.sendHmrMessage({
                type: 'overlay-info-close',
            })
            await updateHash(hashPath, depsHash)

            context.sendHmrMessage({ type: 'reload' })
            const webBundle = bundleMap[relativePath]
            if (!webBundle) {
                throw new Error(
                    `Bundle for '${relativePath}' was not generated in prebundling phase\n${JSON.stringify(
                        bundleMap,
                        null,
                        4,
                    )}`,
                )
            }
            return path.resolve(root, webBundle)
        } catch (e) {
            throw e
        } finally {
            onResolveLock.ready()
        }
    }

    let useFsEvents = false
    try {
        eval('require')('fsevents')
        useFsEvents = true
    } catch (e) {}

    const watcher = chokidar.watch(root, {
        ignored: [
            /(^|[/\\])(node_modules|\.git|\.DS_Store|web_modules)([/\\]|$)/,
        ],
        useFsEvents,
        ignoreInitial: true,
        //   ...chokidarWatchOptions
    })

    app.once('close', async () => {
        logger.debug('closing')
        await Promise.all([watcher.close(), pluginsExecutor.close()])
        app.emit('closed')
    })

    if (config.profile) {
        process.on('SIGINT', () => {
            console.info()
            console.info(pluginsExecutor.printProfilingResult())
            process.exit(0)
        })
    }

    app.on('error', (e: Error) => {
        console.error(chalk.red(e.message))
        console.error(chalk.red(e.stack))
        context.sendHmrMessage({ type: 'overlay-error', err: prepareError(e) })
    })

    // start HMR ws server
    app.once('listening', async () => {
        const wss = new WebSocket.Server({ noServer: true })
        app.once('close', () => {
            wss.close(() => logger.debug('closing wss'))
            wss.clients.forEach((client) => {
                client.close()
            })
        })
        if (!app.context.server) {
            throw new Error(`Cannot find server in context`)
        }
        app.context.server.on('upgrade', (req, socket, head) => {
            if (req.headers['sec-websocket-protocol'] === HMR_SERVER_NAME) {
                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit('connection', ws, req)
                })
            }
        })

        wss.on('connection', (socket) => {
            socket.send(JSON.stringify({ type: 'connected' }))
            socket.on('message', (data) => {
                const message: HMRPayload = JSON.parse(data.toString())
                if (message.type === 'hotAccept') {
                    graph.ensureEntry(importPathToFile(root, message.path), {
                        hasHmrAccept: true,
                        isHmrEnabled: true,
                    })
                }
            })
        })

        wss.on('error', (e: Error & { code: string }) => {
            if (e.code !== 'EADDRINUSE') {
                console.error(chalk.red(`WebSocket server error:`))
                console.error(e)
            }
        })

        // TODO send should wait for clients to be available and resend error and reload messages
        context.sendHmrMessage = (payload: HMRPayload) => {
            const stringified = JSON.stringify(payload, null, 4)
            logger.debug(`hmr: ${stringified}`)
            if (!wss.clients.size) {
                logger.debug(`No clients listening for HMR message`)
            }
            for (let [i, client] of [...wss.clients].entries()) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(stringified)
                } else {
                    logger.log(
                        chalk.red(
                            `Cannot send HMR message, hmr client ${i +
                                1} is not open`,
                        ),
                    )
                }
            }
        }
    })

    // changing anything inside root that is not ignored and that is not in graph will cause reload
    if (config.server?.hmr) {
        watcher.on('change', (filePath) => {
            graph.onFileChange({
                filePath,
                sendHmrMessage: context.sendHmrMessage,
            })
            if (showGraph) {
                logger.log(graph.toString())
            }
        })
    }

    const context: ServerPluginContext = {
        root,
        app,
        watcher,
        config,
        graph,
        pluginExecutor: pluginsExecutor,
        sendHmrMessage: () => {
            // assigned in the hmr middleware
            throw new Error(`hmr ws server has not started yet`)
        },
        // port is exposed on the context for hmr client connection
        // in case the files are served under a different port
        port: Number(config.server?.port || 3000),
    }

    // only js ends up here
    const pluginsMiddleware: Middleware = async (ctx, next) => {
        // Object.assign(ctx, context)
        const req = ctx.req

        if (
            ctx.query.namespace == null &&
            req.headers['sec-fetch-dest'] !== 'script'
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

        // if (!isVirtual) {
        //     graph.ensureEntry(resolvedPath)
        // }

        const sourcemap = transformed.map
            ? genSourceMapString(transformed.map)
            : ''

        ctx.body = transformed.contents + sourcemap
        ctx.status = 200
        ctx.type = 'js'
        return next()
    }

    // open errors in editor
    app.use(middlewares.openInEditorMiddleware({ root }))
    app.use(middlewares.sourcemapMiddleware({ root }))
    app.use(pluginsMiddleware)
    app.use(middlewares.historyFallbackMiddleware({ root, pluginsExecutor }))
    app.use(middlewares.staticServeMiddleware({ root }))
    app.use(
        middlewares.staticServeMiddleware({ root: path.join(root, 'public') }),
    )

    // app.use(require('koa-conditional-get'))
    app.use(etagMiddleware())

    // cors
    if (config.server?.cors) {
        app.use(
            require('@koa/cors')(
                typeof config.server?.cors === 'boolean'
                    ? {}
                    : config.server?.cors,
            ),
        )
    }

    return app
}

function etagCache() {
    return function conditional() {
        return async function(ctx, next) {
            await next()

            if (ctx.fresh) {
                ctx.status = 304
                ctx.body = null
            }
        }
    }
}

// hash assumes that import paths can only grow when installed dependencies grow, this is not the case for deep paths like `lodash/path`, in these cases you will need to use `--force`
async function getDepsHash(root: string) {
    const lockfileLoc = await findUp(
        ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
        {
            cwd: root,
        },
    )
    if (!lockfileLoc) {
        return ''
    }
    const content = await (await fs.readFile(lockfileLoc, 'utf-8')).toString()
    return createHash('sha1')
        .update(content)
        .digest('base64')
        .trim()
}

async function updateHash(hashPath: string, newHash: string) {
    await fs.createFile(hashPath)
    await fs.writeFile(hashPath, newHash.trim())
}

export const rewriteScriptUrlsTransform = (tree: Node) => {
    let count = 0
    tree.walk((node) => {
        if (
            node &&
            node.tag === 'script' &&
            node.attrs &&
            node.attrs['src'] &&
            !isUrl(node.attrs['src'])
        ) {
            count += 1
            let importPath = node.attrs['src']
            if (node.attrs['type'] !== 'module') {
                logger.warn(
                    `<script src="${importPath}"> is missing type="module". Only module scripts are handled by Bundless`,
                )
                return
            }
            const { query } = parseWithQuery(importPath)
            if (query?.namespace != null) {
                return importPath
            }
            node.attrs['src'] = appendQuery(importPath, `namespace=file`)
        }
        return node as any
    })
}
