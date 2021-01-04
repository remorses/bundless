import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { PluginHooks } from '../plugins-executor'
import { importPathToFile, readFile } from '../utils'
import url from 'url'
import { logger } from '../logger'
import qs from 'qs'

export function UrlResolverPlugin({} = {}) {
    return {
        name: 'url-resolver',
        setup: ({ config, onResolve }: PluginHooks) => {
            onResolve({ filter: /\?/ }, async (arg) => {
                if (!arg.path.includes('?')) {
                    return
                }
                const parsed = url.parse(arg.path)
                if (!parsed.pathname) {
                    throw new Error('no pathname in ' + arg.path)
                }
                const query = qs.parse(parsed.query || '')
                if (
                    query.namespace &&
                    typeof query.namespace === 'string' &&
                    query.namespace !== 'file'
                ) {
                    // logger.log(`Removed query from path ${arg.path}`)
                    return {
                        path: parsed.pathname.slice(1), // TODO write a spec for virtual files in url behaviour
                        namespace: query.namespace,
                    }
                }

                return {
                    path: importPathToFile(config.root!, parsed.pathname),
                }
            })
        },
    }
}
