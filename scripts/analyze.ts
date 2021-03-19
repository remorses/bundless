import * as esbuild from 'esbuild'
import fs from 'fs'
import memoize from 'micro-memoize'
import path from 'path'
import slash from 'slash'
import { flatten } from 'lodash'
import { scc } from './scc'
import { graphSequencer } from './topological'
// import { metaToTraversalResult } from '@bundless/cli/src/prebundle/traverse'

const esbuildCwd = path.resolve(
    '/Users/morse/Documents/GitHub/sterblue1/packages/apps/cloud',
)

export function anal(meta: esbuild.Metadata) {
    let graph = metaToTraversalResult({
        meta,
        entryPoints: [path.resolve(esbuildCwd, 'index.html')],
        esbuildCwd,
        root: esbuildCwd,
    })

    const userGraph = Object.fromEntries(
        Object.keys(graph)
            .filter((x) => !x.includes('node_modules'))
            .map((k) => [k, graph[k]]),
    )

    const chunks = scc(userGraph)
    // const { chunks } = graphSequencer({
    //     graph: new Map(
    //         Object.entries(userGraph).map(([a, b]) => [a, b.imports]),
    //     ),
    // })

    console.log(
        JSON.stringify(
            chunks.sort((a, b) => b.length - a.length).slice(0, 10),
            null,
            4,
        ),
    )
    return

    let res = groupByDependency(graph, esbuildCwd)
    const total = Object.keys(res).reduce((a, b) => {
        return a + res[b].bytes
    }, 0)
    console.log('total', formatBytes(total))
    const max = Object.keys(res).sort((a, b) => {
        return res[b].bytes - res[a].bytes
    })

    console.log(
        max.map((x) => x + ' ' + formatBytes(res[x].bytes)).slice(0, 40),
    )

    for (let target of max.slice(0, 10)) {
        const importers: string[] = []
        for (let k in graph) {
            if (k.includes('node_modules')) {
                continue
            }
            const node = graph[k]
            if (
                node.imports.filter((x) => x.startsWith(res[target].basePath))
                    .length
            ) {
                importers.push(k)
            }
        }
        console.log(target + ':')
        console.log(importers, '\n')
    }
}

export type TraversalGraph = Record<string, Node>

interface Node {
    imports: string[]
    bytes: number
}

export function metaToTraversalResult({
    meta,
    entryPoints,
    esbuildCwd,
    root,
}: {
    meta: esbuild.Metadata
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
    const inputs: Record<
        string,
        { imports: { path: string }[]; bytes: number }
    > = Object.fromEntries(
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
                    result[importer] = { imports: [], bytes: input.bytes }
                }
                result[importer] = {
                    imports: currentImports.filter(Boolean).map((importee) => {
                        importee = osAgnosticPath(importee, root)
                        return importee
                    }),
                    bytes: input.bytes,
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

export function osAgnosticPath(absPath: string | undefined, root: string) {
    if (!root) {
        throw new Error(
            `root argument is required, cannot make os agnostic path for ${absPath}`,
        )
    }
    if (!absPath) {
        return ''
    }
    if (!path.isAbsolute(absPath)) {
        absPath = path.resolve(root, absPath)
    }
    return slash(path.relative(root, absPath))
}

const readPackageJson = memoize((p) => {
    try {
        return JSON.parse(fs.readFileSync(p).toString())
    } catch {
        return {}
    }
})

function groupByDependency(graph: TraversalGraph, root: string) {
    const nodeModulesGraph: Record<
        string,
        { bytes: number; basePath: string }
    > = {}
    for (let key in graph) {
        const index = key.lastIndexOf('node_modules')
        if (index === -1) {
            continue
        }
        let dependencySubPath = key
            .slice(index)
            .replace(/\/?node_modules\//, '')

        let dependency = ''
        if (dependencySubPath.startsWith('@')) {
            dependency = getScopedPackageName(dependencySubPath) || ''
        } else {
            dependency = dependencySubPath.slice(
                0,
                dependencySubPath.indexOf('/'),
            )
        }

        const basePath = key.slice(
            0,
            index + 'node_modules/'.length + dependency.length,
        )
        const packageJsonPath = path.posix.join(basePath, 'package.json')
        const json = readPackageJson(packageJsonPath)
        if (json.version) {
            dependency += `@${json.version}`
        }

        if (nodeModulesGraph[dependency]) {
            nodeModulesGraph[dependency].bytes += graph[key].bytes || 0
        } else {
            nodeModulesGraph[dependency] = { bytes: graph[key].bytes, basePath }
        }
    }
    return nodeModulesGraph
}

function getScopedPackageName(path: string): any {
    return path.match(/(@[\w-_\.]+\/[\w-_\.]+)/)?.[1] || ''
}

function formatBytes(bytes) {
    var marker = 1024 // Change to 1000 if required
    var decimal = 3 // Change as required
    var kiloBytes = marker // One Kilobyte is 1024 bytes
    var megaBytes = marker * marker // One MB is 1024 KB
    var gigaBytes = marker * marker * marker // One GB is 1024 MB
    var teraBytes = marker * marker * marker * marker // One TB is 1024 GB

    // return bytes if less than a KB
    if (bytes < kiloBytes) return bytes + ' Bytes'
    // return KB if less than a MB
    else if (bytes < megaBytes)
        return (bytes / kiloBytes).toFixed(decimal) + ' KB'
    // return MB if less than a GB
    else if (bytes < gigaBytes)
        return (bytes / megaBytes).toFixed(decimal) + ' MB'
    // return GB if less than a TB
    else return (bytes / gigaBytes).toFixed(decimal) + ' GB'
}

anal(
    JSON.parse(
        fs.readFileSync(path.resolve(__dirname, 'metafile.json')).toString(),
    ),
)
