import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { dataToEsm } from '@rollup/pluginutils'
import hash_sum from 'hash-sum'
import { CLIENT_PUBLIC_PATH } from '../constants'
import { PluginHooks } from '../plugin'

export const debug = require('debug')('vite:css')

export function codegenCss(
    css: string,
    modules?: Record<string, string>,
): string {
    let code =
        hmrPreamble +
        `
const css = ${JSON.stringify(css)};
if (typeof document !== 'undefined') {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    document.head.removeChild(styleEl);
  });

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(css);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}
`

    if (modules) {
        code += dataToEsm(modules, { namedExports: true })
    } else {
        code += `export default css`
    }
    return code
}

const hmrPreamble = `
import * as  __HMR__ from '${CLIENT_PUBLIC_PATH}';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
`

export function CssPlugin({} = {}) {
    return {
        name: 'css',
        setup: ({ onLoad, onResolve, onTransform }: PluginHooks) => {
            NodeResolvePlugin({ name: 'css', extensions: ['.css'] }).setup({
                onLoad,
                onResolve,
            })
            onTransform({ filter: /\.css$/ }, async (args) => {
                const css = args.contents
                // const id = hash_sum(args.path)
                const contents = codegenCss(css)
                return { contents }
            })
        },
    }
}
