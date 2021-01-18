import chalk from 'chalk'
import chokidar, { FSWatcher } from 'chokidar'
import { createHash } from 'crypto'
import deepmerge from 'deepmerge'
import findUp from 'find-up'
import fs from 'fs-extra'
import { getPort } from 'get-port-please'
import { Server } from 'http'
import Koa, { DefaultContext, DefaultState } from 'koa'
import etagMiddleware from 'koa-etag'
import net from 'net'
import path from 'path'
import { Node } from 'posthtml'
import slash from 'slash'
import { promisify } from 'util'
import { HMRPayload } from './client/types'
import { Config, defaultConfig, getEntries } from './config'
import {
    BUNDLE_MAP_PATH,
    DEFAULT_PORT,
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
import { PluginsExecutor, PluginsExecutorCtx } from './plugins-executor'
import { prebundle } from './prebundle'
import { BundleMap, generateDefineObject } from './prebundle/esbuild'
import { isUrl } from './prebundle/support'
import {
    appendQuery,
    isEmpty,
    Lock,
    needsPrebundle,
    parseWithQuery,
    prepareError,
} from './utils'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

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

    let server = new Server()

    const { app } = await createDevApp(server, config)
    server.on('request', app.callback())

    const preferredServerPort = config.server?.port || DEFAULT_PORT
    const port = await getPort(preferredServerPort)

    if (Number(preferredServerPort) !== Number(port)) {
        logger.warn(
            `Using port ${port} because ${preferredServerPort} is already in use`,
        )
    }
    await promisify(server.listen.bind(server) as any)(port)
    logger.log()
    logger.log(
        `Listening on ${chalk.cyan.underline(`http://localhost:${port}`)}`,
    )
    return server
}

export const onResolveLock = new Lock()

export async function createDevApp(server: net.Server, config: Config) {
    config = deepmerge(defaultConfig, config)
    if (!config.root) {
        config.root = process.cwd()
    }
    const { root } = config

    const app = new Koa<DefaultState, DefaultContext>()

    const graph = new HmrGraph({ root, server })

    const watcher = chokidar.watch(root, {
        ignored: [
            /(^|[/\\])(node_modules|\.git|\.DS_Store|web_modules)([/\\]|$)/,
        ],
        useFsEvents: shouldUseFsEvents(),
        ignoreInitial: true,
        //   ...chokidarWatchOptions
    })

    const executorCtx: PluginsExecutorCtx = {
        config,
        isBuild: false,
        graph,
        root,
        watcher,
    }

    // most of the logic is in plugins
    const pluginsExecutor = new PluginsExecutor({
        ctx: executorCtx,
        isProfiling: config.printStats,
        plugins: [
            // TODO resolve data: imports, rollup emits imports with data: ...
            plugins.HtmlResolverPlugin(),
            plugins.UrlResolverPlugin(), // resolves urls with queries
            plugins.HmrClientPlugin({
                getPort: () => server.address()?.['port'],
            }),
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
            plugins.HtmlTransformUrlsPlugin({
                // must come before rewrite to not warn about the client script not having type=module
                transforms: [rewriteScriptUrlsTransform],
            }),
            plugins.SourceMapSupportPlugin(), // adds source map to errors traces, must be after hmr client plugin
            ...(config.plugins || []), // TODO where should i put user plugins? i should let user override onResolve, but i should also run rewrite on user outputs
            plugins.RewritePlugin(),
        ].map((plugin) => ({
            ...plugin,
            name: 'serve-' + plugin.name,
        })),
    })

    const bundleMapCachePath = path.resolve(root, BUNDLE_MAP_PATH)
    const hashPath = path.resolve(root, WEB_MODULES_PATH, 'deps_hash')

    const depsHash = await getDepsHash(root)
    let prevHash = await fs
        .readFile(hashPath)
        .catch(() => '')
        .then((x) => x.toString().trim())
    const isHashDifferent = !depsHash || !prevHash || prevHash !== depsHash

    if (config.prebundle?.force || isHashDifferent) {
        if (isHashDifferent) {
            logger.log(`Dependencies changed, removing ${WEB_MODULES_PATH}`)
            logger.debug('isHashDifferent', isHashDifferent, prevHash, depsHash)
        }
        await fs.remove(path.resolve(root, '.bundless'))
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
            define: generateDefineObject({ config }),
            root,
        })
        await updateHash(hashPath, depsHash)
    }

    // when resolving if we encounter a node_module run the prebundling phase and invalidate some caches
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
            graph.sendHmrMessage({
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
                define: generateDefineObject({ config }),
                plugins: config.plugins || [],
                root,
            }).catch((e) => {
                graph.sendHmrMessage({
                    type: 'overlay-info-close',
                })
                graph.sendHmrMessage({
                    type: 'overlay-error',
                    err: prepareError(e),
                })
                throw e
            })
            graph.sendHmrMessage({
                type: 'overlay-info-close',
            })
            await updateHash(hashPath, depsHash)

            graph.sendHmrMessage({ type: 'reload' })
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

    server.once('close', async () => {
        logger.debug('closing')
        await Promise.all([watcher.close(), pluginsExecutor.close()])
        app.emit('closed')
    })

    if (config.printStats) {
        process.on('SIGINT', () => {
            console.info()
            console.info(pluginsExecutor.printProfilingResult())
            process.exit(0)
        })
    }

    app.on('error', (e: Error) => {
        console.error(chalk.red(e.message))
        console.error(chalk.red(e.stack))
        graph.sendHmrMessage({ type: 'overlay-error', err: prepareError(e) })
    })

    server.once('listening', () => {
        config.server = { ...config.server, port: server.address()?.['port'] }
    })

    if (config.server?.hmr) {
        watcher.on('change', (filePath) => {
            graph.onFileChange({
                filePath,
            })
            if (showGraph) {
                logger.log(graph.toString())
            }
        })
    }

    // only js ends up here

    app.use(middlewares.openInEditorMiddleware({ root }))
    app.use(middlewares.sourcemapMiddleware({ root }))
    app.use(middlewares.pluginsMiddleware({ root, pluginsExecutor, watcher }))
    app.use(middlewares.historyFallbackMiddleware({ root, pluginsExecutor }))
    app.use(middlewares.staticServeMiddleware({ root }))
    app.use(
        middlewares.staticServeMiddleware({
            root: path.resolve(root, 'public'),
        }),
    )

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

    return { app, pluginsExecutor }
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
    return createHash('sha1').update(content).digest('base64').trim()
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
            }
            const { query } = parseWithQuery(importPath)
            if (query?.namespace != null) {
                return node
            }
            node.attrs['src'] = appendQuery(importPath, `namespace=file`)
        }
        return node as any
    })
}

function shouldUseFsEvents() {
    try {
        eval('require')('fsevents')
        return true
    } catch (e) {}
    return false
}
