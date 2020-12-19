import { NodeResolvePlugin } from '@esbuild-plugins/all'
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
                const contents = codegenJson(JSON.parse(json))
                return { contents }
            })
        },
    }
}

function codegenJson(json) {
    return `
const json = ${JSON.stringify(json, null, 4)};
export default json;
`
}
