import { NodeResolvePlugin } from '@esbuild-plugins/all'
import escapeStringRegexp from 'escape-string-regexp'
import path from 'path'
import { PluginHooks } from '../plugin'
import { fileToImportPath } from '../utils'


export function AssetsPlugin({ extensions }) {
    const extensionsSet = new Set(extensions)
    return {
        name: 'assets',
        setup: ({ onLoad, onResolve, config }: PluginHooks) => {
            const filter = new RegExp(
                '(' + extensions.map(escapeStringRegexp).join('|') + ')$',
            )
            // what if an image is in another module and this resolver bypasses the node resolve plugin that runs the prebundle? maybe i need to throw? no because assets do not need to be optimized, i just need to make sure that node resolve is called before all other resolvers
            NodeResolvePlugin({ name: 'assets', extensions }).setup({
                onLoad() {},
                onResolve,
            })
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
