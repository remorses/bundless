import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { transform } from 'esbuild'
import { PluginHooks } from '../plugins-executor'
import { readFile } from '../utils'

export function JSONPlugin({} = {}) {
    return {
        name: 'json',
        setup: (hooks: PluginHooks) => {
            const { onLoad, onResolve } = hooks
            NodeResolvePlugin({
                name: 'json-node-resolve',
                isExtensionRequiredInImportPath: true,
                extensions: ['.json'],
            }).setup({
                ...hooks,
                onLoad() {},
            })
            onLoad({ filter: /\.json$/ }, async (args) => {
                const json = await readFile(args.path)
                const transformed = await transform(json, {
                    format: 'esm',
                    loader: 'json',
                    sourcefile: args.path,
                })
                const contents = transformed.code
                return { contents }
            })
        },
    }
}
