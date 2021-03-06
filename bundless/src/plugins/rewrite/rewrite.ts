import chalk from 'chalk'
import { ImportSpecifier, parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import path from 'path'
import { CLIENT_PUBLIC_PATH, hmrPreamble } from '../../constants'
import { HmrGraph } from '../../hmr-graph'
import { logger } from '../../logger'
import { PluginHooks, PluginsExecutor } from '../../plugins-executor'
import { onResolveLock } from '../../serve'
import {
    appendQuery,
    cleanUrl,
    fileToImportPath,
    isExternalUrl,
    jsTypeRegex,
    osAgnosticPath,
} from '../../utils'
import {
    generateNamespaceExport,
    isOptimizedCjs,
    transformCjsImport,
} from './commonjs'

export function RewritePlugin({ filter = jsTypeRegex } = {}) {
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
            onTransform({ filter }, async (args) => {
                const { contents, map } = await rewriteImports({
                    graph,
                    namespace: args.namespace || 'file',
                    importer: args.path,
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
    importer,
    graph,
    pluginsExecutor,
    namespace,
    root,
}: {
    source: string
    namespace: string
    importer: string
    pluginsExecutor: PluginsExecutor
    root: string
    graph: HmrGraph
}): Promise<{ contents: string; map?: any }> {
    // strip UTF-8 BOM
    if (source.charCodeAt(0) === 0xfeff) {
        source = source.slice(1)
    }
    const relativeImporter = osAgnosticPath(importer, root)
    // TODO how are computed files path removed?
    graph.ensureEntry(importer)
    try {
        await onResolveLock.wait()
        let imports: ImportSpecifier[] = []
        try {
            imports = parseImports(source)[0]
        } catch (e) {
            throw new Error(
                `Failed to parse ${chalk.cyan(
                    importer,
                )} for import rewrite.\nIf you are using ` +
                    `JSX, make sure to named the file with the .jsx extension.`,
            )
        }

        const isHmrEnabled = source.includes('import.meta.hot')
        const hasEnv = source.includes('import.meta.env')

        if (!imports.length && !isHmrEnabled && !hasEnv) {
            return { contents: source }
        }

        const magicString = new MagicString(source)

        if (isHmrEnabled) {
            magicString.prepend(hmrPreamble)
        }
        const currentNode = graph.ensureEntry(importer, {
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
                    importer,
                    namespace,
                    resolveDir: path.dirname(importer),
                    path: id,
                })

                if (!resolveResult || !resolveResult.path) {
                    // do not fail on unresolved dynamic imports
                    if (isDynamicImport) {
                        logger.log(
                            `Cannot resolve '${id}' from '${relativeImporter}'`,
                        )
                        continue
                    }
                    throw new Error(
                        `Cannot resolve '${id}' from '${relativeImporter}'`,
                    )
                }

                if (resolveResult?.pluginData) {
                    logger.warn(
                        `esbuild pluginData is not supported by bundless, used by plugin ${resolveResult.pluginName}`,
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
                    resolveResult.namespace || namespace,
                )
                resolvedImportPath = appendQuery(
                    resolvedImportPath,
                    `namespace=${newNamespace}`,
                )

                // TODO maybe also register virtual files, ok onFileChange will never get triggered but maybe there is virtual css file or stuff like that that needs to be updated?
                if (!isVirtual) {
                    const importeeNode = graph.ensureEntry(resolveResult.path)

                    // do not use stale modules
                    resolvedImportPath = appendQuery(
                        resolvedImportPath,
                        `t=${
                            importeeNode.hash + importeeNode.lastUsedTimestamp
                        }`,
                    )
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
                }
            } else if (id !== 'import.meta' && !hasIgnore) {
                logger.log(
                    chalk.yellow(
                        `Cannot rewrite dynamic import(${id}) in ${relativeImporter}.`,
                    ),
                )
            }
        }

        return {
            contents: magicString.toString(),
            map: undefined, // do i really need sourcemaps? code is readable enough
        }
    } catch (e) {
        e.message = `Invalid module ${relativeImporter}\n` + e
        throw e
    }
}
