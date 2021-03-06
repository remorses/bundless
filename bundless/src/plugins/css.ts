import { NodeResolvePlugin, resolveAsync } from '@esbuild-plugins/all'
import { transform } from 'esbuild'
import escapeStringRegexp from 'escape-string-regexp'
import hash_sum from 'hash-sum'
import path from 'path'
import fs from 'fs-extra'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../constants'
import { PluginHooks } from '../plugins-executor'
import { osAgnosticPath } from '../utils'

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
            ctx: { root, config, isBuild, graph },
            onLoad,
            onResolve,
            onTransform,
        }: PluginHooks) => {
            // TODO use custom resolver that adds the .js extension to css paths?
            async function cssResolver(args) {
                try {
                    const res = await resolveAsync(args.path, {
                        basedir: args.resolveDir,
                    })
                    const virtualPath = res + '.cssjs'
                    
                    if (res) {
                        return {
                            path: virtualPath,
                        }
                    }
                } catch {}
            }
            onResolve({ filter: /\.css$/ }, cssResolver)
            const cssExtensions = Object.keys(config.loader || {})
                .filter((k) => config.loader?.[k] === 'css')
                .map(escapeStringRegexp)
            if (cssExtensions.length) {
                onResolve(
                    {
                        filter: new RegExp(
                            '(' + cssExtensions.join('|') + ')$',
                        ),
                    },
                    cssResolver,
                )
            }
            onLoad({ filter: /\.cssjs$/ }, async (args) => {
                try {
                    const css = await (
                        await fs.readFile(args.path.replace(/\.cssjs$/, ''))
                    ).toString()
                    // const id = hash_sum(args.path)

                    let contents = await codegenCssForDev(css, args.path)
                    if (!isBuild) {
                        contents = hmrPreamble + '\n' + contents
                    }
                    return { contents, loader: 'js' }
                } catch {}
            })
            // needed for other plugins that return css and are not resolved by this plugin
            onTransform({ filter: /\.css$/ }, async (args) => {
                let contents = await codegenCssForDev(args.contents, args.path)
                if (!isBuild) {
                    contents = hmrPreamble + '\n' + contents
                }
                return { contents, loader: 'js' }
            })

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

export async function codegenCssForDev(
    css: string,
    sourcefile: string,
    modules?: Record<string, string>,
) {
    let code = `
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
        const transformed = await transform(JSON.stringify(modules), {
            format: 'esm',
            loader: 'json',
            sourcefile,
        })
        code += transformed.code
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
