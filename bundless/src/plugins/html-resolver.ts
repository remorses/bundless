import { NodeResolvePlugin, resolveAsync } from '@esbuild-plugins/all'
import { PluginHooks } from '../plugin'
import fs from 'fs-extra'
import path from 'path'

export function HtmlResolverPlugin({} = {}) {
    return {
        name: 'html-resolver',
        setup: ({ onLoad, onResolve }: PluginHooks) => {
            // TODO HtmlResolverPlugin must resolve directories to index.html, /a -> /a/index.html
            // TODO resolve root index html to public
            onResolve({ filter: /\.*/ }, async (args) => {
                var resolved = await resolveAsync(args.path, {
                    basedir: args.resolveDir,
                    extensions: ['.html'],
                }).catch(() => '')
                if (resolved) {
                    return {
                        path: resolved,
                    }
                }
                var resolved = await resolveAsync(
                    path.join(args.path, 'public') + '/',
                    {
                        basedir: args.resolveDir,
                        extensions: ['.html'],
                    },
                ).catch(() => '')
                if (resolved) {
                    console.log({ resolved })
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
