import * as esbuild from 'esbuild'
import { promises } from 'fs-extra'
import { Config } from './config'
import { Graph } from './graph'
import { logger } from './logger'
import { osAgnosticPath } from './prebundle/support'

export interface Plugin {
    name: string
    setup: (build: PluginHooks) => void
}

export interface PluginHooks {
    resolve: PluginsExecutor['resolve']
    config: Config
    graph: Graph
    onResolve(
        options: esbuild.OnResolveOptions,
        callback: (
            args: esbuild.OnResolveArgs,
        ) => Maybe<
            esbuild.OnResolveResult | Promise<Maybe<esbuild.OnResolveResult>>
        >,
    ): void
    onLoad(
        options: esbuild.OnLoadOptions,
        callback: (
            args: esbuild.OnLoadArgs,
        ) => Maybe<esbuild.OnLoadResult | Promise<Maybe<esbuild.OnLoadResult>>>,
    ): void
    onTransform(
        options: esbuild.OnLoadOptions,
        callback: (
            args: OnTransformArgs,
        ) => Maybe<OnTransformResult | Promise<Maybe<OnTransformResult>>>,
    ): void
    onClose(options: {}, callback: () => void | Promise<void>): void
}

export interface OnTransformArgs {
    path: string
    loader?: esbuild.Loader
    contents: string
}

export interface OnTransformResult {
    contents?: string
    map?: any
    loader?: esbuild.Loader
}

type Maybe<x> = x | undefined | null

export interface PluginsExecutor {
    load(args: esbuild.OnLoadArgs): Promise<Maybe<esbuild.OnLoadResult>>
    transform(args: OnTransformArgs): Promise<Maybe<OnTransformResult>>
    resolve(args: esbuild.OnResolveArgs): Promise<Maybe<esbuild.OnResolveArgs>>
    close({}): Promise<void>
}

export function createPluginsExecutor({
    plugins,
    config,
    graph,
    root,
}: {
    plugins: Plugin[]
    config: Config
    graph: Graph
    root: string
}): PluginsExecutor {
    const transforms: any[] = []
    const resolvers: any[] = []
    const loaders: any[] = []
    const closers: any[] = []
    for (let plugin of plugins) {
        const { name, setup } = plugin
        setup({
            resolve,
            config,
            graph,
            onLoad: (options, callback) => {
                loaders.push({ options, callback, name })
            },
            onResolve: (options, callback) => {
                resolvers.push({ options, callback, name })
            },
            onTransform: (options, callback) => {
                transforms.push({ options, callback, name })
            },
            onClose: (options, callback) => {
                closers.push({ options, callback, name })
            },
        })
    }
    async function load(arg) {
        let result
        for (let { callback, options, name } of loaders) {
            const { filter } = options
            if (filter && filter.test(arg.path)) {
                logger.debug(
                    `loading '${osAgnosticPath(
                        arg.path,
                        root,
                    )}' with '${name}'`,
                )
                result = await callback(arg)
                break
            }
        }
        return result
    }
    async function transform(arg) {
        let result
        for (let { callback, options, name } of transforms) {
            const { filter } = options
            if (filter && filter.test(arg.path)) {
                logger.debug(`transforming '${arg.path}' with '${name}'`)
                const newResult = await callback(arg)
                if (newResult?.contents) {
                    arg.contents = newResult.contents
                    result = newResult
                }
                // break
            }
        }
        return result
    }
    async function resolve(arg) {
        let result
        for (let { callback, options, name } of resolvers) {
            const { filter } = options
            if (filter && filter.test(arg.path)) {
                logger.debug(`resolving '${arg.path}' with '${name}'`)
                result = await callback(arg)
                // break
            }
        }
        return result
    }
    async function close(arg) {
        let result
        for (let { callback, options, name } of closers) {
            logger.debug(`cleaning resources for '${name}'`)
            await callback(arg)
        }
        return result
    }

    return {
        load,
        resolve,
        transform,
        close,
    }
}
