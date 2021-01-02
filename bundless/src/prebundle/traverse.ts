import {
    HtmlIngestPlugin,
    NodeModulesPolyfillPlugin,
    NodeResolvePlugin,
} from '../plugins'
import deepmerge from 'deepmerge'
import { build, BuildOptions, Metadata, Plugin } from 'esbuild'
import { promises as fsp } from 'fs'
import fsx, { copySync } from 'fs-extra'
import os from 'os'
import path from 'path'
import slash from 'slash'
import {
    importableAssets,
    isRunningWithYarnPnp,
    JS_EXTENSIONS,
    MAIN_FIELDS,
} from '../constants'

import { osAgnosticPath, runFunctionOnPaths } from './support'
import fromEntries from 'fromentries'
import { stripColon, unique } from './support'
import { flatten } from '../utils'
import { logger } from '../logger'
import {
    commonEsbuildOptions,
    generateDefineObject,
    resolvableExtensions,
} from './esbuild'

type Args = {
    esbuildCwd: string
    root: string
    entryPoints: string[]
    plugins: Plugin[]
    esbuildOptions?: Partial<BuildOptions>
    // resolver?: (cwd: string, id: string) => string
    stopTraversing?: (resolvedPath: string) => boolean
}

export async function traverseWithEsbuild({
    entryPoints,
    esbuildCwd,
    root,
    plugins,
    esbuildOptions = { plugins: [] },
    stopTraversing,
}: Args): Promise<string[]> {
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

    try {
        const metafile = path.join(destLoc, 'meta.json')
        // logger.log(`Running esbuild in cwd '${process.cwd()}'`)

        await build(
            deepmerge(
                {
                    ...commonEsbuildOptions,
                    define: generateDefineObject({}),
                    entryPoints,
                    outdir: destLoc,
                    metafile,
                    plugins: [
                        ...(plugins || []),
                        HtmlIngestPlugin({ root }),
                        ExternalButInMetafile(),
                        NodeModulesPolyfillPlugin(),
                        NodeResolvePlugin({
                            name: 'traverse-node-resolve',
                            mainFields: MAIN_FIELDS,
                            extensions: resolvableExtensions,
                            onResolved: function external(resolved) {
                                if (
                                    stopTraversing &&
                                    stopTraversing(resolved)
                                ) {
                                    return {
                                        namespace: externalNamespace,
                                        path: resolved,
                                    }
                                }
                                return
                            },
                            onNonResolved: (p) => {
                                console.error(
                                    `Cannot resolve '${p}' during traversal`,
                                )
                                // return {
                                //     external: true,
                                // }
                            },
                        }),
                    ],
                } as BuildOptions,
                esbuildOptions,
            ),
        )
        let meta: Metadata = JSON.parse(
            await (await fsp.readFile(metafile)).toString(),
        )
        // console.log(JSON.stringify(meta, null, 4))
        meta = runFunctionOnPaths(meta, stripColon)

        const res = metaToTraversalResult({
            meta,
            entryPoints,
            root,
            esbuildCwd,
        })

        return Object.keys(res)
    } finally {
        await fsx.remove(destLoc)
    }
}

const externalNamespace = 'external-but-keep-in-metafile'
function ExternalButInMetafile(): Plugin {
    return {
        name: externalNamespace,
        setup(build) {
            const externalModule = 'externalModuleXXX'
            build.onResolve(
                {
                    filter: new RegExp(externalModule),
                    namespace: externalNamespace,
                },
                (args) => {
                    if (args.path !== externalModule) {
                        return
                    }
                    return {
                        external: true,
                    }
                },
            )
            build.onLoad(
                {
                    filter: /.*/,
                    namespace: externalNamespace,
                },
                (args) => {
                    const contents = `export * from '${externalModule}'`
                    return {
                        contents,
                        loader: 'js',
                        // resolveDir: path.dirname(args.path),
                    }
                },
            )
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
    meta: Metadata
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
