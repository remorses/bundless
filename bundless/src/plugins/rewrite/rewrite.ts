import chalk from 'chalk'
import { ImportSpecifier, parse as parseImports } from 'es-module-lexer'
import LRUCache from 'lru-cache'
import MagicString from 'magic-string'
import { SourceMap } from 'module'
import path from 'path'
import qs from 'qs'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../../constants'
import { HmrGraph } from '../../hmr-graph'
import { logger } from '../../logger'
import { PluginHooks, PluginsExecutor } from '../../plugins-executor'
import { osAgnosticPath } from '../../utils'
import { onResolveLock } from '../../serve'
import {
    appendQuery,
    cleanUrl,
    fileToImportPath,
    isExternalUrl,
    jsTypeRegex,
    parseWithQuery,
} from '../../utils'
import {
    generateNamespaceExport,
    isOptimizedCjs,
    transformCjsImport,
} from './commonjs'

const rewriteCache = new LRUCache({ max: 1024 })

export function RewritePlugin({} = {}) {
    return {
        name: 'rewrite',
        setup: ({
            onTransform,
            pluginsExecutor,
            ctx: { graph, config, root, isBuild },
        }: PluginHooks) => {
            if (config.platform !== 'browser') {
                return
            }
            if (isBuild || !graph) {
                return
            }
            onTransform({ filter: jsTypeRegex }, async (args) => {
                const { contents, map } = await rewriteImports({
                    graph,
                    namespace: args.namespace || 'file',
                    importerFilePath: args.path,
                    root,
                    pluginsExecutor,
                    source: args.contents,
                })
                return {
                    contents, // TODO module rewrite needs not need sourcemaps? How?
                    map,
                }
            })
        },
    }
}

export async function rewriteImports({
    source,
    importerFilePath,
    graph,
    pluginsExecutor,
    namespace,
    root,
}: {
    source: string
    namespace: string
    importerFilePath: string
    pluginsExecutor: PluginsExecutor
    root: string
    graph: HmrGraph
}): Promise<{ contents: string; map?: any }> {
    // strip UTF-8 BOM
    if (source.charCodeAt(0) === 0xfeff) {
        source = source.slice(1)
    }
    graph.ensureEntry(importerFilePath)
    try {
        await onResolveLock.wait()
        let imports: ImportSpecifier[] = []
        try {
            imports = parseImports(source)[0]
        } catch (e) {
            throw new Error(
                `Failed to parse ${chalk.cyan(
                    importerFilePath,
                )} for import rewrite.\nIf you are using ` +
                    `JSX, make sure to named the file with the .jsx extension.`,
            )
        }

        const isHmrEnabled = source.includes('import.meta.hot')
        const hasEnv = source.includes('import.meta.env')

        if (!imports.length && !isHmrEnabled && !hasEnv) {
            // logger.log(`no imports found for ${importerFilePath}`)
            return { contents: source }
        }

        const magicString = new MagicString(source)

        // TODO add the client script in html, this way i can make the page reload also when there is an error during rewrite
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
            const hasIgnore = /\/\*\s*@bundless-ignore\s*\*\//.test(id)
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

                const resolveResult = await pluginsExecutor.resolve({
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
                            // rewrite `import('package')` to
                            // import('/package').then(m=>({...((m.default instanceof Object && m.default.constructor === Object) && m.default), ...m})));
                            magicString.overwrite(
                                dynamicIndex,
                                end + 1,
                                `import('${resolvedImportPath}').then(m=>${generateNamespaceExport(
                                    'm',
                                )})`,
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
            } else if (id !== 'import.meta' && !hasIgnore) {
                logger.log(
                    chalk.yellow(
                        `Cannot rewrite dynamic import(${id}) in ${importerFilePath}.`,
                    ),
                )
            }
        }

        return {
            contents: magicString.toString(),
            map: undefined, // do i really need sourcemaps? code is readable enough
        }
    } catch (e) {
        e.message =
            `Error: module imports rewrite failed for ${importerFilePath}\n` + e
        throw e
    }
}
