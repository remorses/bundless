import fs from 'fs-extra'
import { CLIENT_PUBLIC_PATH } from '../constants'
import { PluginHooks } from '../plugins-executor'

export const sourceMapSupportPath =
    '__source-map-support.js?namespace=source-map-support'

export function SourceMapSupportPlugin({} = {}) {
    return {
        name: 'hmr-client',
        setup: ({
            onLoad,
            onTransform,
            ctx: { config, root },
        }: PluginHooks) => {
            // TODO reenable source map support
            return
            onTransform({ filter: /\.html$/ }, (args) => {
                const contents = args.contents.replace(
                    /<body.*?>/,
                    `$&\n` +
                        `<script src="/${sourceMapSupportPath}"></script>\n` +
                        `<script>window.sourceMapSupport = sourceMapSupport; sourceMapSupport.install();</script>\n`,
                )
                return {
                    contents,
                }
            })

            onLoad(
                { filter: /.*/, namespace: 'source-map-support' },
                async () => {
                    return {
                        contents: await fs.readFile(
                            require.resolve(
                                'source-map-support/browser-source-map-support.js',
                            ),
                        ),
                    }
                },
            )
        },
    }
}
