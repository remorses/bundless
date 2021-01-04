import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { dataToEsm } from '@rollup/pluginutils'
import escapeStringRegexp from 'escape-string-regexp'
import hash_sum from 'hash-sum'
import path from 'path'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../constants'
import { PluginHooks } from '../plugin'

const CSS_UTILS_PATH = '_bundless_css_utils.js'

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
        setup: ({
            config,
            onLoad,
            onResolve,
            onTransform,
            isBuild,
        }: PluginHooks) => {
            if (isBuild) {
                return
            }

            const root = config.root!
            NodeResolvePlugin({
                name: 'css-node-resolve',
                extensions: ['.css'],
            }).setup({
                onLoad,
                onResolve,
            })

            // TODO try to make this path virtual
            onResolve(
                { filter: new RegExp(escapeStringRegexp(CSS_UTILS_PATH)) },
                (args) => {
                    return {
                        path: path.resolve(root, cssUtilsTemplate),
                    }
                },
            )
            onLoad(
                { filter: new RegExp(escapeStringRegexp(CSS_UTILS_PATH)) },
                (args) => {
                    return {
                        contents: cssUtilsTemplate,
                        loader: 'js',
                    }
                },
            )

            const codegenCss = isBuild
                ? codegenCssForProduction
                : codegenCssForDev

            onTransform({ filter: /\.css$/ }, async (args) => {
                const css = args.contents
                // const id = hash_sum(args.path)

                const contents = codegenCss(css)
                return { contents }
            })
        },
    }
}

const cssUtilsTemplate = `
function ensureCss(href) {
    const existingLinkTags = document.getElementsByTagName('link')
    for (let i = 0; i < existingLinkTags.length; i++) {
        if (tag.rel === 'stylesheet' && tag.getAttribute('href') === href) {
            return
        }
    }

    const linkTag = document.createElement('link')
    linkTag.rel = 'stylesheet'
    linkTag.type = 'text/css'
    linkTag.href = href

    const head = document.getElementsByTagName('head')[0]
    head.appendChild(linkTag)
}
`

export function codegenCssForDev(
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

export function codegenCssForProduction(
    cssPath: string,
    modules?: Record<string, string>,
): string {
    let code =
        hmrPreamble +
        `
import { ensureCSS } from '${CSS_UTILS_PATH}'
if (typeof window !== 'undefined') {
    ensureCSS(${JSON.stringify(cssPath)})
}
`

    return code
}
