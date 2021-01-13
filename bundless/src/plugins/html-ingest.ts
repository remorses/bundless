import fs from 'fs'
import posthtml, { Node, Plugin as PosthtmlPlugin } from 'posthtml'
import path from 'path'
import { Plugin } from '../plugins-executor'
import { cleanUrl } from '../utils'
import slash from 'slash'
const NAME = 'html-ingest'

interface Options {
    name?: string
    root: string // to resolve paths in case the html page is not in root
    transformImportPath?: (importPath: string) => string
    // emitHtml?: (arg: { path: string; html: string }) => Promise<void>
}

/**
 * Let you use html files as entrypoints for esbuild
 */
export function HtmlIngestPlugin({
    name = NAME,
    root,
    transformImportPath,
}: Options): Plugin {
    return {
        name,
        setup: function setup({ onLoad, onTransform, onResolve }) {
            onTransform({ filter: /\.html$/ }, async (args) => {
                try {
                    const html = args.contents

                    const jsUrls = await getHtmlScriptsUrls(html)

                    // const folder = path.relative(root, path.dirname(args.path))
                    const pathToRoot = slash(
                        path.relative(path.dirname(args.path), root),
                    )

                    const contents = jsUrls
                        .map((importPath) => {
                            // src='/file.js' -> ../../file.js
                            if (importPath.startsWith('/')) {
                                importPath = path.posix.join(
                                    pathToRoot,
                                    '.' + importPath,
                                )
                            }
                            // src='file.js' -> ./file.js
                            if (bareImportRE.test(importPath)) {
                                importPath = './' + importPath
                            }

                            return importPath
                        })
                        .map((x) =>
                            transformImportPath ? transformImportPath(x) : x,
                        )
                        .map((importPath) => `export * from '${importPath}'`)
                        .join('\n')

                    return {
                        loader: 'js',
                        contents,
                    }
                } catch (e) {
                    throw new Error(`Cannot transform html ${args.path}, ${e}`)
                }
            })
        },
    }
}

export async function getHtmlScriptsUrls(html: string) {
    const urls: string[] = []
    const transformer = posthtml([
        (tree) => {
            tree.walk((node) => {
                if (
                    node &&
                    node.tag === 'script' &&
                    node.attrs &&
                    node.attrs['type'] === 'module' &&
                    node.attrs['src'] &&
                    isRelative(node.attrs['src'])
                ) {
                    urls.push(node.attrs['src'])
                }
                return node
            })
        },
    ])
    try {
        await transformer.process(html)
    } catch (e) {
        throw new Error(`Cannot process html with posthtml: ${e}\n${html}`)
    }
    return urls.filter(Boolean)
}

const bareImportRE = /^[^\/\.]/
function isRelative(x: string) {
    x = cleanUrl(x)
    return bareImportRE.test(x) || x.startsWith('.') || x.startsWith('/')
}
