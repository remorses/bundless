import chalk from 'chalk'
import { ImportSpecifier, parse as parseImports } from 'es-module-lexer'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import path from 'path'
import qs from 'qs'
import { CLIENT_PUBLIC_PATH } from '../../constants'
import { Graph } from '../../graph'
import { PluginHooks, PluginsExecutor } from '../../plugin'
import { osAgnosticPath } from '../../prebundle/support'
import {
    cleanUrl,
    fileToRequest,
    isExternalUrl,
    jsTypeRegex,
    parseWithQuery,
} from '../../utils'
import { isOptimizedCjs, transformCjsImport } from './commonjs'

const debug = require('debug')('vite:rewrite')

const rewriteCache = new LRUCache({ max: 1024 })

export function RewritePlugin({} = {}) {
    return {
        name: 'rewrite',
        setup: ({ onTransform, resolve, graph, config }: PluginHooks) => {
            onTransform({ filter: jsTypeRegex }, async (args) => {
                // console.log(graph.toString())
                // TODO skip non js files
                const contents = await rewriteImports({
                    graph,
                    importer: args.path,
                    root: config.root!,
                    resolve,
                    source: args.contents,
                })
                return {
                    contents, // TODO module rewrite needs sourcemaps?
                }
            })
        },
    }
}

export async function rewriteImports({
    source,
    importer,
    graph,
    resolve,
    root,
}: {
    source: string
    importer: string
    resolve: PluginsExecutor['resolve']
    root: string
    graph: Graph
}): Promise<string> {
    // #806 strip UTF-8 BOM
    if (source.charCodeAt(0) === 0xfeff) {
        source = source.slice(1)
    }
    try {
        let imports: ImportSpecifier[] = []
        try {
            imports = parseImports(source)[0]
        } catch (e) {
            console.error(
                chalk.yellow(
                    `failed to parse ${chalk.cyan(
                        importer,
                    )} for import rewrite.\nIf you are using ` +
                        `JSX, make sure to named the file with the .jsx extension.`,
                ),
            )
        }

        const hasHMR = source.includes('import.meta.hot')
        const hasEnv = source.includes('import.meta.env')

        if (imports.length || hasHMR || hasEnv) {
            debug(`${importer}: rewriting`)
            const s = new MagicString(source)
            let hasReplaced = false

            const currentImportees = graph.ensureEntry(importer).importees

            for (let i = 0; i < imports.length; i++) {
                const {
                    s: start,
                    e: end,
                    d: dynamicIndex,
                    ss: expStart,
                    se: expEnd,
                } = imports[i]
                let id = source.substring(start, end)
                const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(id)
                let hasLiteralDynamicId = false
                if (dynamicIndex >= 0) {
                    // #998 remove comment
                    id = id.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
                    const literalIdMatch = id.match(
                        /^\s*(?:'([^']+)'|"([^"]+)")\s*$/,
                    )
                    if (literalIdMatch) {
                        hasLiteralDynamicId = true
                        id = literalIdMatch[1] || literalIdMatch[2]
                    }
                }
                if (dynamicIndex === -1 || hasLiteralDynamicId) {
                    // do not rewrite external imports
                    if (isExternalUrl(id)) {
                        continue
                    }

                    const resolveResult = await resolve({
                        importer,
                        namespace: '',
                        resolveDir: path.dirname(importer),
                        path: id,
                    })
                    const resolved = fileToRequest(
                        root,
                        resolveResult?.path || '',
                    ) // TODO add ?import ...

                    if (resolved !== id) {
                        debug(`    "${id}" --> "${resolved}"`)
                        if (
                            isOptimizedCjs(
                                root,
                                osAgnosticPath(resolveResult?.path, root),
                            )
                        ) {
                            if (dynamicIndex === -1) {
                                const exp = source.substring(expStart, expEnd)
                                const replacement = transformCjsImport(
                                    exp,
                                    id,
                                    resolved,
                                    i,
                                )
                                s.overwrite(expStart, expEnd, replacement)
                            } else if (hasLiteralDynamicId) {
                                // rewrite `import('package')`
                                s.overwrite(
                                    dynamicIndex,
                                    end + 1,
                                    `import('${resolved}').then(m=>m.default)`,
                                )
                            }
                        } else {
                            s.overwrite(
                                start,
                                end,
                                hasLiteralDynamicId
                                    ? `'${resolved}'`
                                    : resolved,
                            )
                        }
                        hasReplaced = true
                    }

                    // save the import chain for hmr analysis
                    const importee = cleanUrl(resolved)
                    if (
                        importee !== importer &&
                        // no need to track hmr client or module dependencies
                        importee !== CLIENT_PUBLIC_PATH
                    ) {
                        currentImportees.add(importee)
                        debug(`        ${importer} imports ${importee}`)
                    }
                } else if (id !== 'import.meta' && !hasViteIgnore) {
                    console.warn(
                        chalk.yellow(
                            `ignored dynamic import(${id}) in ${importer}.`,
                        ),
                    )
                }
            }

            // if (hasHMR) {
            //     debugHmr(`rewriting ${importer} for HMR.`)
            //     rewriteFileWithHMR(root, source, importer, resolver, s)
            //     hasReplaced = true
            // }

            // if (hasEnv) {
            //     debug(`    injecting import.meta.env for ${importer}`)
            //     s.prepend(
            //         `import __VITE_ENV__ from "${envPublicPath}"; ` +
            //             `import.meta.env = __VITE_ENV__; `,
            //     )
            //     hasReplaced = true
            // }

            // since the importees may have changed due to edits,
            // check if we need to remove this importer from certain importees
            // if (prevImportees) {
            //     prevImportees.forEach((importee) => {
            //         if (!currentImportees.has(importee)) {
            //             const importers = importerMap.get(importee)
            //             if (importers) {
            //                 importers.delete(importer)
            //             }
            //         }
            //     })
            // }

            if (!hasReplaced) {
                debug(`    nothing needs rewriting.`)
            }

            return hasReplaced ? s.toString() : source
        } else {
            debug(`${importer}: no imports found.`)
        }

        return source
    } catch (e) {
        throw new Error(
            `Error: module imports rewrite failed for ${importer}.\n` +
                e,
        )
        debug(source)
        return source
    }
}

function removeUnRelatedHmrQuery(url: string) {
    const { path, query } = parseWithQuery(url)
    delete query.t
    delete query.import
    if (Object.keys(query).length) {
        return path + '?' + qs.stringify(query)
    }
    return path
}
