import chalk from 'chalk'
import { ImportSpecifier, parse as parseImports } from 'es-module-lexer'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import path from 'path'
import qs from 'qs'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../../constants'
import { Graph } from '../../graph'
import { logger } from '../../logger'
import { PluginHooks, PluginsExecutor } from '../../plugin'
import { osAgnosticPath } from '../../prebundle/support'
import {
    appendQuery,
    cleanUrl,
    fileToImportPath,
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
            // TODO some modules like json modules are not in graph, maybe register modules in middleware? how to rewrite files that have not the js extension?
            onTransform({ filter: jsTypeRegex }, async (args) => {
                // console.log(graph.toString())
                const contents = await rewriteImports({
                    graph,
                    namespace: args.namespace || 'file',
                    importerFilePath: args.path,
                    root: config.root!,
                    resolve,
                    source: args.contents,
                })
                return {
                    contents, // TODO does module rewrite needs sourcemaps?
                }
            })
        },
    }
}

export async function rewriteImports({
    source,
    importerFilePath,
    graph,
    resolve,
    namespace,
    root,
}: {
    source: string
    namespace: string
    importerFilePath: string
    resolve: PluginsExecutor['resolve']
    root: string
    graph: Graph
}): Promise<string> {
    // strip UTF-8 BOM
    if (source.charCodeAt(0) === 0xfeff) {
        source = source.slice(1)
    }
    graph.ensureEntry(importerFilePath, { importees: new Set() })
    try {
        let imports: ImportSpecifier[] = []
        try {
            imports = parseImports(source)[0]
        } catch (e) {
            console.error(
                chalk.yellow(
                    `failed to parse ${chalk.cyan(
                        importerFilePath,
                    )} for import rewrite.\nIf you are using ` +
                        `JSX, make sure to named the file with the .jsx extension.`,
                ),
            )
        }

        const isHmrEnabled = source.includes('import.meta.hot')
        const hasEnv = source.includes('import.meta.env')

        if (!imports.length && !isHmrEnabled && !hasEnv) {
            // logger.log(`no imports found for ${importerFilePath}`)
            return source
        }

        const magicString = new MagicString(source)

        if (isHmrEnabled) {
            magicString.prepend(hmrPreamble)
        }
        const currentNode = graph.ensureEntry(importerFilePath, {
            isHmrEnabled,
            importees: new Set(),
        })

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
            const isDynamicImport = dynamicIndex >= 0
            if (isDynamicImport) {
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
                    importer: importerFilePath,
                    namespace,
                    resolveDir: path.dirname(importerFilePath),
                    path: id,
                })

                if (!resolveResult) {
                    // do not fail on unresolved dynamic imports
                    if (isDynamicImport) {
                        logger.log(
                            `Cannot resolve '${id}' from '${importerFilePath}'`,
                        )
                        continue
                    }
                    throw new Error(
                        `Cannot resolve '${id}' from '${importerFilePath}'`,
                    )
                }

                let resolvedImportPath = ''
                const isVirtual =
                    resolveResult.namespace &&
                    resolveResult.namespace !== 'file'
                // handle bare imports like node builtins, virtual files, ...
                if (isVirtual || !path.isAbsolute(resolveResult.path || '')) {
                    resolvedImportPath = '/' + resolveResult.path
                } else {
                    resolvedImportPath = fileToImportPath(
                        root,
                        resolveResult?.path || '',
                    )
                }

                const newNamespace = encodeURIComponent(
                    resolveResult.namespace || namespace, // TODO in esbuild do loaded files inherit namespace?
                )
                resolvedImportPath = appendQuery(
                    resolvedImportPath,
                    `namespace=${newNamespace}`,
                )

                // TODO maybe also register virtual files, ok onFileChange will never get triggered but maybe there is virtual css file or stuff like that that needs to be updated?
                if (!isVirtual) {
                    const importeeNode = graph.ensureEntry(
                        osAgnosticPath(resolveResult.path, root),
                    )

                    // refetch modules that are dirty
                    if (importeeNode?.dirtyImportersCount > 0) {
                        const timestamp = ++importeeNode.lastUsedTimestamp
                        resolvedImportPath = appendQuery(
                            resolvedImportPath,
                            `t=${timestamp}`,
                        )
                        importeeNode.dirtyImportersCount--
                    } else if (importeeNode?.lastUsedTimestamp) {
                        // do not use stale modules
                        resolvedImportPath = appendQuery(
                            resolvedImportPath,
                            `t=${importeeNode.lastUsedTimestamp}`,
                        )
                    }
                }

                if (resolvedImportPath !== id) {
                    if (isOptimizedCjs(root, resolveResult.path || '')) {
                        if (dynamicIndex === -1) {
                            const exp = source.substring(expStart, expEnd)
                            const replacement = transformCjsImport(
                                exp,
                                id,
                                resolvedImportPath,
                                i,
                            )
                            magicString.overwrite(expStart, expEnd, replacement)
                        } else if (hasLiteralDynamicId) {
                            // rewrite `import('package')`
                            magicString.overwrite(
                                dynamicIndex,
                                end + 1,
                                `import('${resolvedImportPath}').then(m=>m.default)`,
                            )
                        }
                    } else {
                        magicString.overwrite(
                            start,
                            end,
                            hasLiteralDynamicId
                                ? `'${resolvedImportPath}'`
                                : resolvedImportPath,
                        )
                    }
                }

                // save the import chain for hmr analysis
                const cleanImportee = cleanUrl(resolvedImportPath)
                if (
                    // no need to track hmr client or module dependencies
                    cleanImportee !== CLIENT_PUBLIC_PATH
                ) {
                    currentNode.importees.add(cleanImportee)
                    // logger.log(`${importerFilePath} imports ${cleanImportee}`)
                }
            } else if (id !== 'import.meta' && !hasViteIgnore) {
                logger.log(
                    chalk.yellow(
                        `ignored dynamic import(${id}) in ${importerFilePath}.`,
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

        return magicString.toString()
    } catch (e) {
        e.message =
            `Error: module imports rewrite failed for ${importerFilePath}\n` + e
        throw e
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
