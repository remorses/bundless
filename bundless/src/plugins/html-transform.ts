import posthtml, { Plugin } from 'posthtml'
import { PluginHooks } from '../plugin'
import { cleanUrl } from '../utils'

export function HtmlTransformUrlsPlugin({
    transforms,
}: {
    transforms: Plugin<any>[]
}) {
    return {
        name: 'html-transform-urls',
        setup: ({ onTransform, onResolve }: PluginHooks) => {
            onTransform({ filter: /\.html$/ }, async (args) => {
                const transformer = posthtml([...transforms])
                const result = await transformer.process(args.contents)
                const contents = result.html
                return { contents }
            })
        },
    }
}

// TODO transformer to rewrite inline script imports

export function transformScriptTags(
    mapper: (x: string) => string,
): Plugin<any> {
    return (tree) => {
        tree.walk((node) => {
            if (
                node &&
                node.tag === 'script' &&
                node.attrs &&
                node.attrs['type'] === 'module' &&
                node.attrs['src'] &&
                isRelative(node.attrs['src'])
            ) {
                node.attrs['src'] = mapper(node.attrs['src'])
            }
            return node
        })
    }
}

export const bareImportRE = /^[^\/\.]/
export function isRelative(x: string) {
    x = cleanUrl(x)
    return bareImportRE.test(x) || x.startsWith('.') || x.startsWith('/')
}
