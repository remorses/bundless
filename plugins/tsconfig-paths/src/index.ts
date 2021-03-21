import { MAIN_FIELDS, Plugin } from '@bundless/cli'
import globrex from 'globrex'
import path from 'path'
import { createMatchPath } from 'tsconfig-paths'

export default TsconfigPathsPlugin

export function TsconfigPathsPlugin(options: PluginOptions): Plugin {
    return {
        name: 'alias-plugin', // alias plugins need to have enforce pre or node resolve will have higher priority
        enforce: 'pre',
        setup({ onResolve, pluginsExecutor, ctx: { root, config } }) {
            const matchPath = createMatchPath(
                root,
                options.paths,
                MAIN_FIELDS, // TODO allow customization with config.mainFields
                true,
            )

            const regexes = Object.keys(options.paths)
                .map((x) => globrex(x, {}))
                .map((x) => x.regex)

            regexes.forEach((filter) => {
                onResolve({ filter: filter! }, async (args) => {
                    const resolved = matchPath(args.path)
                    if (!resolved) {
                        return null
                    }
                    const res = await pluginsExecutor.resolve({
                        ...args,
                        path: resolved,
                    })
                    if (!res || !res.path) {
                        return {
                            ...res,
                            path: resolved,
                        }
                    }
                    return res
                })
            })
        },
    }
}

type PluginOptions = {
    paths: Record<string, string[]>
}
