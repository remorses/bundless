import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { dataToEsm } from '@rollup/pluginutils'
import { PluginHooks } from '../plugin'
import { fileToImportPath, readFile } from '../utils'
import escapeStringRegexp from 'escape-string-regexp'
import path from 'path'

export function AssetsPlugin({ extensions }) {
    const extensionsSet = new Set(extensions)
    return {
        name: 'assets',
        setup: ({ onLoad, onResolve, config }: PluginHooks) => {
            // TODO what if an image is in another module and this resolver bypasses the node resolve plugin that runs the prebundle? maybe i need to throw?
            NodeResolvePlugin({ name: 'assets', extensions }).setup({
                onLoad() {},
                onResolve,
            })
            const filter = new RegExp(
                '(' + extensions.map(escapeStringRegexp).join('|') + ')$',
            )
            onLoad({ filter }, async (args) => {
                if (!extensionsSet.has(path.extname(args.path))) {
                    return
                }
                const publicPath = fileToImportPath(config.root!, args.path)
                return {
                    contents: `export default ${JSON.stringify(publicPath)}`,
                }
            })
        },
    }
}
