import fs from 'fs-extra'
import path from 'path'
import { PluginHooks } from '../plugins-executor'

export function HtmlResolverPlugin({} = {}) {
    return {
        name: 'html-resolver',
        setup: ({ ctx: { root }, onLoad, onResolve }: PluginHooks) => {
            onResolve({ filter: /\.html/ }, async (args) => {
                args.path = path.resolve(root, args.path)

                var resolved = path.resolve(args.resolveDir || root, args.path)
                if (resolved && fs.existsSync(resolved)) {
                    return {
                        path: resolved,
                    }
                }
                const relativePath = path.relative(root, args.path)
                var resolved = path.resolve(
                    path.resolve(root, path.join('public', relativePath)),
                )
                if (resolved && fs.existsSync(resolved)) {
                    return {
                        path: resolved,
                    }
                }
                return null
            })

            onLoad({ filter: /\.html$/ }, async (args) => {
                try {
                    const realFilePath = args.path // .replace('.html.js', '.html')
                    const html = await (
                        await fs.readFile(realFilePath, {
                            encoding: 'utf-8',
                        })
                    ).toString()
                    return {
                        contents: html,
                        loader: 'html' as any,
                    }
                } catch (e) {
                    return null
                    throw new Error(`Cannot load ${args.path}, ${e}`)
                }
            })
        },
    }
}
