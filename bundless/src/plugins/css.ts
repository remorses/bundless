import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { dataToEsm } from '@rollup/pluginutils'
import hash_sum from 'hash-sum'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../constants'
import { PluginHooks } from '../plugin'

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

/* 
importing a css module file does 2 things
- import a js file that calls ensureCssLink and exports the class names as js object
- add the link in the html entry at build time

This way even if you load the app from a different entrypoint and you change location via history API, you get ensureCssLink that adds the link to the html

Global css files instead must be all loaded at once because its classnames are not unique
*/

export function CssPlugin({} = {}) {
    return {
        name: 'css',
        setup: ({ onLoad, onResolve, onTransform }: PluginHooks) => {
            NodeResolvePlugin({
                name: 'css-node-resolve',
                extensions: ['.css'],
            }).setup({
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
