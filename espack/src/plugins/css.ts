import { dataToEsm } from '@rollup/pluginutils'
import hash_sum from 'hash-sum'
import { CLIENT_PUBLIC_PATH } from '../constants'
import { PluginHooks } from '../plugin'

export const debug = require('debug')('vite:css')

export function codegenCss(
    id: string,
    css: string,
    modules?: Record<string, string>,
): string {
    let code =
        `import { updateStyle } from "${CLIENT_PUBLIC_PATH}"\n` +
        `const css = ${JSON.stringify(css)}\n` +
        `updateStyle(${JSON.stringify(id)}, css)\n`
    if (modules) {
        code += dataToEsm(modules, { namedExports: true })
    } else {
        code += `export default css`
    }
    return code
}

export function CssPlugin({} = {}) {
    return {
        name: 'css',
        setup: ({ onTransform }: PluginHooks) => {
            // TODO add a simple onLoad function creator to simply add support for reading from non js extension?
            onTransform({ filter: /\.css$/ }, async (args) => {
                const css = args.contents
                const id = hash_sum(args.path)
                const contents = codegenCss(id, css)
                return { contents }
            })
        },
    }
}
