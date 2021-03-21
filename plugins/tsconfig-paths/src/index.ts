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
                '',
                options.paths,
                MAIN_FIELDS, // TODO allow customization with config.mainFields
                true,
            )

            const regexes = Object.keys(options.paths)
                .map((x) => globrex(x, {}))
                .map((x) => x.regex)

            regexes.forEach((filter) => {
                onResolve({ filter: filter! }, async (args) => {
                    console.log(args.path)
                    const resolved = matchPath(args.path)
                    console.log(resolved)
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
    /**
     * Implicit extensions used when resolving an import path
     * like `./App` which has no explicit extension like `./App.vue` does.
     *
     * TypeScript and JavaScript extensions are used by default.
     */
    baseUrl?: string
    paths: Record<string, string[]>
}
