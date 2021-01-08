import posthtml, { Plugin } from 'posthtml'
import { PluginHooks } from '../plugins-executor'
import { cleanUrl } from '../utils'

export function HtmlTransformUrlsPlugin({
    transforms,
}: {
    transforms: Plugin<any>[]
}) {
    return {
        name: 'html-transform-urls',
        setup: ({ onTransform }: PluginHooks) => {
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

