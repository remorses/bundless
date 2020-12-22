import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { dataToEsm } from '@rollup/pluginutils'
import { PluginHooks } from '../plugin'
import { readFile } from '../utils'

export function JSONPlugin({} = {}) {
    return {
        name: 'json',
        setup: ({ onLoad, onResolve, onTransform }: PluginHooks) => {
            NodeResolvePlugin({ name: 'json', extensions: ['.json'] }).setup({
                onLoad() {},
                onResolve,
            })
            onLoad({ filter: /\.json$/ }, async (args) => {
                const json = await readFile(args.path)
                // const id = hash_sum(args.path)
                const contents = dataToEsm(JSON.parse(json), {
                    namedExports: true,
                    preferConst: true,
                })
                return { contents }
            })
        },
    }
}
