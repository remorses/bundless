import { NodeResolvePlugin, resolveAsync } from '@esbuild-plugins/all'
import { PluginHooks } from '../plugins-executor'
import fs from 'fs-extra'
import path from 'path'

export function HtmlResolverPlugin({} = {}) {
    return {
        name: 'html-resolver',
        setup: ({ ctx: { root }, onLoad, onResolve }: PluginHooks) => {
            // TODO test that HtmlResolverPlugin can resolve directories to index.html, /a -> /a/index.html
            onResolve({ filter: /\.html/ }, async (args) => {
                args.path = path.resolve(root, args.path)
                var resolved = await resolveAsync(args.path, {
                    basedir: args.resolveDir,
                    extensions: ['.html'],
                }).catch(() => '')
                if (resolved) {
                    return {
                        path: resolved,
                    }
                }
                const relativePath = path.relative(root, args.path)
                var resolved = await resolveAsync(
                    path.resolve(root, path.join('public', relativePath)),
                    {
                        basedir: args.resolveDir,
                        extensions: ['.html'],
                    },
                ).catch(() => '')
                if (resolved) {
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
