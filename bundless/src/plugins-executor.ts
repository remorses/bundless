import { O_TRUNC } from 'constants'
import * as esbuild from 'esbuild'
import { promises } from 'fs-extra'
import { Config } from './config'
import url from 'url'
import { HmrGraph } from './hmr-graph'
import { logger } from './logger'
import { osAgnosticPath } from './utils'
import qs from 'qs'
import { mergeSourceMap } from './utils/sourcemaps'
import path from 'path'
import { ansiChart } from './utils/profiling'
import { FSWatcher } from 'chokidar'

export interface Plugin {
    name: string
    setup: (build: PluginHooks) => void
}

type OnResolveCallback = (
    args: esbuild.OnResolveArgs,
) => Maybe<esbuild.OnResolveResult | Promise<Maybe<esbuild.OnResolveResult>>>

type OnLoadCallback = (
    args: esbuild.OnLoadArgs,
) => Maybe<esbuild.OnLoadResult | Promise<Maybe<esbuild.OnLoadResult>>>

type OnTransformCallback = (
    args: OnTransformArgs,
) => Maybe<OnTransformResult | Promise<Maybe<OnTransformResult>>>

type OnCloseCallback = () => void | Promise<void>

export interface PluginsExecutorCtx {
    config: Config
    root: string
    graph?: HmrGraph
    isBuild: boolean
    watcher?: FSWatcher
}
export interface PluginHooks {
    ctx: PluginsExecutorCtx
    pluginsExecutor: PluginsExecutor
    onResolve(
        options: esbuild.OnResolveOptions,
        callback: OnResolveCallback,
    ): void
    onLoad(options: esbuild.OnLoadOptions, callback: OnLoadCallback): void
    onTransform(
        options: esbuild.OnLoadOptions,
        callback: OnTransformCallback,
    ): void
    onClose(options: any, callback: OnCloseCallback): void
}

export interface OnTransformArgs {
    path: string
    loader?: esbuild.Loader
    namespace?: string
    contents: string
}

export interface OnTransformResult {
    contents?: string
    map?: any
    loader?: esbuild.Loader
}

type Maybe<x> = x | undefined | null

// export interface PluginsExecutor {
//     load(args: esbuild.OnLoadArgs): Promise<Maybe<esbuild.OnLoadResult>>
//     transform(args: OnTransformArgs): Promise<Maybe<OnTransformResult>>
//     resolve(
//         args: esbuild.OnResolveArgs,
//     ): Promise<Maybe<esbuild.OnResolveResult>>
//     close({}): Promise<void>
// }

type PluginInternalObject<CB> = {
    name: string
    options: { filter: RegExp; namespace?: string }
    callback: CB
}

export class PluginsExecutor {
    ctx: PluginsExecutorCtx
    plugins: Plugin[]
    isProfiling: boolean

    private transforms: PluginInternalObject<OnTransformCallback>[] = []
    private resolvers: PluginInternalObject<OnResolveCallback>[] = []
    private loaders: PluginInternalObject<OnLoadCallback>[] = []
    private closers: PluginInternalObject<OnCloseCallback>[] = []

    constructor(_args: {
        plugins: Plugin[]
        ctx: PluginsExecutorCtx
        isProfiling?: boolean
    }) {
        const { ctx, plugins, isProfiling = false } = _args

        this.ctx = ctx
        this.plugins = plugins
        this.isProfiling = isProfiling
        // this.config = {...config, root}

        for (let plugin of plugins) {
            if (isProfiling) {
                plugin = this.wrapPluginForProfiling(plugin)
            }
            const { name, setup } = plugin
            setup({
                ctx,
                pluginsExecutor: this,
                onLoad: (options, callback) => {
                    this.loaders.push({ options, callback, name })
                },
                onResolve: (options, callback) => {
                    this.resolvers.push({ options, callback, name })
                },
                onTransform: (options, callback) => {
                    this.transforms.push({ options, callback, name })
                },
                onClose: (options, callback) => {
                    this.closers.push({ options, callback, name })
                },
            })
        }
    }

    private matches(
        options: { filter: RegExp; namespace?: string },
        arg: { path?: string; namespace?: string },
    ) {
        if (!arg.path) {
            return false
        }
        if (options.filter && !options.filter.test(arg.path)) {
            return false
        }
        const optsNamespace = options.namespace || 'file'
        const argNamespace = arg.namespace || 'file'
        if (argNamespace !== optsNamespace) {
            return false
        }
        return true
    }

    async load(arg: esbuild.OnLoadArgs): Promise<Maybe<esbuild.OnLoadResult>> {
        let result
        for (let { callback, options, name } of this.loaders) {
            if (this.matches(options, arg)) {
                logger.debug(
                    `loading '${osAgnosticPath(
                        arg.path,
                        this.ctx.root,
                    )}' with '${name}'`,
                )
                const newResult = await callback(arg)
                if (newResult) {
                    result = newResult
                    break
                }
            }
        }
        if (result) {
            return { ...result, namespace: result.namespace || 'file' }
        }
    }
    async transform(arg: OnTransformArgs): Promise<Maybe<OnTransformResult>> {
        let result: OnTransformResult = { contents: arg.contents }
        for (let { callback, options, name } of this.transforms) {
            if (this.matches(options, arg)) {
                logger.debug(`transforming '${arg.path}' with '${name}'`)
                const newResult = await callback(arg)
                if (newResult?.contents != null) {
                    arg.contents = newResult.contents
                    result.contents = newResult.contents
                }
                if (newResult?.loader) {
                    arg.loader = newResult.loader
                    result.loader = newResult.loader
                }
                // merge with previous source maps
                if (newResult?.map) {
                    if (result.map) {
                        result.map = mergeSourceMap(result.map, newResult.map)
                    } else {
                        result.map = newResult.map
                    }
                }
            }
        }
        return result
    }

    /**
     * Resolve filter should match on basename and not rely on absolute path, "virtual" could be passed as absolute paths from root: /path/to/virtual_file
     */
    async resolve(
        arg: Partial<esbuild.OnResolveArgs>,
    ): Promise<Maybe<esbuild.OnResolveResult>> {
        let result
        // support for resolving paths with queries

        for (let { callback, options, name } of this.resolvers) {
            if (this.matches(options, arg)) {
                logger.debug(`resolving '${arg.path}' with '${name}'`)
                const newResult = await callback({
                    importer: '',
                    namespace: 'file',
                    resolveDir: '',
                    path: '',
                    ...arg,
                })
                if (newResult && newResult.path) {
                    logger.debug(
                        `resolved '${
                            arg.path
                        }' with '${name}' as '${osAgnosticPath(
                            newResult.path,
                            this.ctx.root,
                        )}'`,
                    )
                    result = newResult
                    break
                }
                // break
            }
        }
        if (result) {
            return { ...result, namespace: result.namespace || 'file' }
        }
    }
    async close() {
        let result
        for (let { callback, options, name } of this.closers) {
            logger.debug(`cleaning resources for '${name}'`)
            await callback()
        }
        return result
    }

    async resolveLoadTransform({
        path: p,
        importer = '',
        namespace = 'file',
        expectedExtensions,
    }: {
        path: string
        importer?: string
        namespace?: string
        expectedExtensions?: string[]
    }): Promise<{ path?: string; contents?: string }> {
        let resolveDir = path.dirname(p)
        if (resolveDir === '/' || resolveDir === '.') {
            resolveDir = ''
        }
        const resolved = await this.resolve({
            importer,
            namespace,
            path: p,
            resolveDir,
        })
        if (!resolved || !resolved.path) {
            return {}
        }
        if (
            expectedExtensions &&
            !expectedExtensions.includes(path.extname(resolved.path))
        ) {
            return {}
        }
        const loaded = await this.load({
            namespace: resolved.namespace || 'file',
            path: resolved.path,
        })
        if (!loaded) {
            return {}
        }
        const transformed = await this.transform({
            contents: String(loaded.contents),
            path: resolved.path,
            loader: loaded.loader || 'default',
            namespace: resolved.namespace || 'file',
        })
        if (!transformed) {
            return { contents: String(loaded.contents), path: resolved.path }
        }
        return { contents: String(transformed.contents), path: resolved.path }
    }

    esbuildPlugins() {
        return this.plugins.map((plugin, index) =>
            this.wrapPluginForEsbuild(plugin),
        )
    }

    profilingData: {
        resolvers: Record<string, number>
        loaders: Record<string, number>
        transforms: Record<string, number>
    } = {
        resolvers: {},
        loaders: {},
        transforms: {},
    }

    printProfilingResult() {
        let str = '\n\nProfiling data:\n\n'
        // console.log(this.profilingData)
        const data = Object.keys(this.profilingData).map((k) => {
            const timeConsume: number = Object.values(
                this.profilingData[k],
            ).reduce(sum, 0) as any
            return {
                path: k,
                timeConsume,
            }
        })
        if (data.map((x) => x.timeConsume).reduce(sum, 0) === 0) {
            return ''
        }
        str += ansiChart(data)
        str += '\n\nResolvers\n\n'
        const resolversData = Object.keys(this.profilingData.resolvers).map(
            (pluginName) => {
                return {
                    path: pluginName,
                    timeConsume: this.profilingData.resolvers[pluginName],
                }
            },
        )
        const opts = { limit: 3 }
        str += ansiChart(resolversData, opts)
        str += '\n\nLoaders\n\n'
        const loadersData = Object.keys(this.profilingData.loaders).map(
            (pluginName) => {
                return {
                    path: pluginName,
                    timeConsume: this.profilingData.loaders[pluginName],
                }
            },
        )
        str += ansiChart(loadersData, opts)
        str += '\n\nTransforms\n\n'
        const transformsData = Object.keys(this.profilingData.transforms).map(
            (pluginName) => {
                return {
                    path: pluginName,
                    timeConsume: this.profilingData.transforms[pluginName],
                }
            },
        )
        str += ansiChart(transformsData, opts)
        str += '\n'
        return str
    }

    private wrapPluginForProfiling(plugin: Plugin): Plugin {
        const pluginsExecutor: PluginsExecutor = this
        const { profilingData: profiledData } = this
        const { name } = plugin

        function wrapMethod(method, type: string) {
            return async (...args) => {
                const timeStart = Date.now()
                const res = await method(...args)
                const delta = Date.now() - timeStart
                profiledData[type][name] =
                    (profiledData[type][name] || 0) + delta
                return res
            }
        }

        return {
            name,
            setup(hooks) {
                plugin.setup({
                    ...hooks,
                    pluginsExecutor,
                    // wrap onLoad to execute other plugins transforms
                    onLoad: wrapMethod(hooks.onLoad, 'loaders'),
                    onResolve: wrapMethod(hooks.onResolve, 'resolvers'),
                    onTransform: wrapMethod(hooks.onTransform, 'transforms'),
                })
            },
        }
    }

    private wrapPluginForEsbuild(plugin: Plugin): esbuild.Plugin {
        const pluginsExecutor: PluginsExecutor = this

        return {
            name: plugin.name,
            setup({ onLoad, onResolve }) {
                plugin.setup({
                    onResolve,
                    // the plugin transform is already inside pluginsExecutor
                    onTransform() {},
                    onClose() {},
                    ctx: pluginsExecutor.ctx,
                    pluginsExecutor,

                    // wrap onLoad to execute other plugins transforms
                    onLoad(options, callback) {
                        onLoad(options, async (args) => {
                            const result = await callback(args)
                            if (!result) {
                                return
                            }
                            // run all transforms from other plugins
                            const transformed = await pluginsExecutor.transform(
                                {
                                    path: args.path,
                                    contents: String(result?.contents),
                                    loader: result.loader,
                                },
                            )
                            if (!transformed) {
                                return result
                            }
                            return {
                                ...result,
                                contents: transformed.contents,
                                loader: transformed.loader || result.loader,
                                resolveDir: result.resolveDir,
                            }
                        })
                    },
                })
            },
        }
    }
}

const sum = (a, b): number => a + b
