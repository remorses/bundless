import deepmerge from 'deepmerge'
import * as esbuild from 'esbuild'
import { build, BuildOptions, Metafile, Plugin } from 'esbuild'
import fromEntries from 'fromentries'
import { promises as fsp } from 'fs'
import { resolveAsync } from '@esbuild-plugins/all'
import fsx from 'fs-extra'
import os from 'os'
import path from 'path'
import { isRunningWithYarnPnp, MAIN_FIELDS } from '../constants'
import { HmrGraph } from '../hmr-graph'
import { logger } from '../logger'
import { PluginsExecutor } from '../plugins-executor'
import * as plugins from '../plugins'
import { flatten, needsPrebundle, osAgnosticPath } from '../utils'
import {
    commonEsbuildOptions,
    generateDefineObject,
    defaultResolvableExtensions,
} from './esbuild'

import { runFunctionOnPaths, stripColon, unique } from './support'
import { rewriteScriptUrlsTransform } from '../serve'

import { Config } from '../config'

type Args = {
    root: string
    entryPoints: string[]
    config: Config
    filter?: RegExp
    esbuildOptions?: Partial<BuildOptions>
    // resolver?: (cwd: string, id: string) => string
    stopTraversing?: (resolvedPath: string) => boolean
}

export async function traverseWithEsbuild({
    entryPoints,
    filter,
    root,
    config,
}: Args): Promise<string[]> {
    const define = generateDefineObject({ config })
    const userPlugins = config.plugins || []
    const destLoc = await fsp.realpath(
        path.resolve(await fsp.mkdtemp(path.join(os.tmpdir(), 'dest'))),
    )

    for (let entry of entryPoints) {
        if (!path.isAbsolute(entry)) {
            throw new Error(
                `All entryPoints of traverseWithEsbuild must be absolute: ${entry}`,
            )
        }
    }

    logger.debug(`Traversing entrypoints ${JSON.stringify(entryPoints, [], 4)}`)

    const allPlugins = [
        // TODO esbuild does not let overriding plugins, this means that if user is using plugin to alias a package to a file it will skip ExternalButInMetafile and break everything
        ...(userPlugins || []),
        plugins.NodeModulesPolyfillPlugin(),
        plugins.HtmlResolverPlugin(),
        plugins.HtmlTransformUrlsPlugin({
            transforms: [rewriteScriptUrlsTransform],
        }),
        plugins.HtmlIngestPlugin({ root }),
        plugins.NodeResolvePlugin({
            name: 'traverse-node-resolve',
            mainFields: MAIN_FIELDS,
            extensions: [
                ...defaultResolvableExtensions,
                ...(config.importableAssetsExtensions || []),
            ],
            // TODO use different plugin that only runs on bare imports
            onNonResolved: (p, importer) => {
                logger.warn(
                    `Cannot resolve '${p}' from '${importer}' during traversal, using yarn pnp: ${isRunningWithYarnPnp}`,
                )
            },
        }),

        plugins.UrlResolverPlugin(),
    ].map((plugin) => ({
        ...plugin,
        name: 'traversal-' + plugin.name,
    }))
    const pluginsExecutor = new PluginsExecutor({
        plugins: allPlugins,
        ctx: {
            isBuild: true,
            config: { root },
            root,
        },
    })
    let graph: TraversalGraph = {}
    try {
        // logger.log(`Running esbuild in cwd '${process.cwd()}'`)

        let { metafile: meta } = await build({
            ...commonEsbuildOptions(config),
            define,
            entryPoints,
            outdir: destLoc,
            plugins: [
                traversalGraphPlugin({
                    executor: pluginsExecutor,
                    graph,
                    filter,
                    stopTraversing(p) {
                        return needsPrebundle(config, p)
                    },
                }),
                ...pluginsExecutor.esbuildPlugins(),
            ],
        })

        // console.log(JSON.stringify(meta, null, 4))
        let knownModules = pluginsExecutor.modulesToPrebundle()
        knownModules = await Promise.all(
            knownModules.map((x) =>
                resolveAsync(x, {
                    basedir: root,
                    mainFields: MAIN_FIELDS,
                }).then((x) => x || ''),
            ),
        )
        knownModules = knownModules.filter(Boolean)
        return unique([...Object.keys(graph), ...knownModules])
    } finally {
        await fsx.remove(destLoc)
    }
}

export function traversalGraphPlugin({
    filter,
    graph,
    executor,
    stopTraversing,
}: {
    filter?: RegExp
    graph: TraversalGraph
    executor: PluginsExecutor
    stopTraversing: Function
}): esbuild.Plugin {
    return {
        name: 'register-modules',
        setup({ onResolve }) {
            onResolve({ filter: filter || /()/ }, async (args) => {
                const res = await executor.resolve({
                    importer: args.importer,
                    path: args.path,
                    resolveDir: args.resolveDir,
                })
                if (!res || !res.path) {
                    return null
                }

                const importer = osAgnosticPath(
                    args.importer,
                    executor.ctx.root,
                )
                const importee = osAgnosticPath(res.path, executor.ctx.root)
                if (importer) {
                    if (!graph[importer]) {
                        graph[importer] = [importee]
                    } else {
                        graph[importer].push(importee)
                    }
                }
                if (!graph[importee]) {
                    graph[importee] = []
                }
                if (stopTraversing(res.path)) {
                    return { external: true }
                }
            })
        },
    }
}

type TraversalGraph = Record<string, string[]>

/**
 * Returns a module graph implemented as an object, keys are modules (relative paths from root), values are arrays of key's imports (absolute paths)
 */
export function metaToTraversalResult({
    meta,
    entryPoints,
    esbuildCwd,
    root,
}: {
    meta: Metafile
    esbuildCwd: string
    root: string
    entryPoints: string[]
}): TraversalGraph {
    if (!path.isAbsolute(esbuildCwd)) {
        throw new Error('esbuildCwd must be an absolute path')
    }
    for (let entry of entryPoints) {
        if (!path.isAbsolute(entry)) {
            throw new Error('entry must be an absolute path')
        }
    }
    const alreadyProcessed = new Set<string>()
    // must be all absolute paths
    let toProcess = entryPoints
    const result: TraversalGraph = {}
    // abs path -> input info
    const inputs: Record<string, { imports: { path: string }[] }> = fromEntries(
        Object.keys(meta.inputs).map((k) => {
            const abs = path.resolve(esbuildCwd, k)
            return [abs, meta.inputs[k]]
        }),
    )
    while (toProcess.length) {
        const newImports = flatten(
            toProcess.map((absPath): string[] => {
                if (alreadyProcessed.has(absPath)) {
                    return []
                }
                alreadyProcessed.add(absPath)
                // newEntry = path.posix.normalize(newEntry) // TODO does esbuild always use posix?
                const input = inputs[absPath]
                if (input == null) {
                    throw new Error(
                        `entry '${absPath}' is not present in esbuild metafile inputs ${JSON.stringify(
                            Object.keys(inputs),
                            null,
                            2,
                        )}`,
                    )
                }
                // abs paths
                const currentImports: string[] = input.imports
                    ? input.imports
                          .map((x) => x.path)
                          .map((x) => {
                              if (!path.isAbsolute(x)) {
                                  return path.resolve(esbuildCwd, x)
                              }
                              return x
                          })
                          .filter((x) => Boolean(x))
                    : []
                // newImports.push(...currentImports)

                const importer = osAgnosticPath(
                    path.resolve(esbuildCwd, absPath),
                    root,
                )
                if (!result[importer]) {
                    result[importer] = []
                }
                for (let importee of currentImports) {
                    if (!importee) {
                        continue
                    }
                    importee = osAgnosticPath(importee, root)
                    result[importer].push(importee)
                }

                return currentImports
            }),
        ).filter(Boolean)
        toProcess = newImports
    }
    return result
    // find the right output getting the key of the right output.inputs == input
    // get the imports of the inputs.[entry].imports and attach them the importer
    // do the same with the imports just found
    // return the list of input files
}
