import * as esbuild from 'esbuild'

export interface Plugin {
    name: string
    setup: (build: PluginHooks) => void
}

export interface PluginHooks {
    resolve: PluginsExecutor['resolve']
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
}

export interface OnTransformArgs {
    path: string
    contents: string
}

export interface OnTransformResult {
    code?: string
    map?: any
    loader?: esbuild.Loader
}

type Maybe<x> = x | undefined | null

interface PluginsExecutor {
    load(args: esbuild.OnLoadArgs): Promise<Maybe<esbuild.OnLoadResult>>
    transform(args: OnTransformArgs): Promise<Maybe<OnTransformResult>>
    resolve(args: esbuild.OnResolveArgs): Promise<Maybe<esbuild.OnResolveArgs>>
}

export function createPluginsExecutor({
    plugins,
}: {
    plugins: Plugin[]
}): PluginsExecutor {
    const transforms: any[] = []
    const resolvers: any[] = []
    const loaders: any[] = []
    for (let plugin of plugins) {
        const { name, setup } = plugin
        setup({
            resolve,
            onLoad: (options, callback) => {
                loaders.push({ options, callback, name })
            },
            onResolve: (options, callback) => {
                resolvers.push({ options, callback, name })
            },
            onTransform: (options, callback) => {
                transforms.push({ options, callback, name })
            },
        })
    }
    async function load(filePath) {
        let result
        for (let { callback, options } of loaders) {
            const { filter } = options
            if (filter && filter.test(filePath)) {
                result = await callback(filePath)
                // break
            }
        }
        return result
    }
    async function transform(filePath) {
        let result
        for (let { callback, options } of transforms) {
            const { filter } = options
            if (filter && filter.test(filePath)) {
                result = await callback(filePath)
                // break
            }
        }
        return result
    }
    async function resolve(id) {
        let result
        for (let { callback, options } of resolvers) {
            const { filter } = options
            if (filter && filter.test(id)) {
                result = await callback(id)
                // break
            }
        }
        return result
    }

    return {
        load,
        resolve,
        transform,
    }
}
