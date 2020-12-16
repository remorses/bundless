import chalk from 'chalk'
import fs, { stat } from 'fs-extra'
import path from 'path'
import slash from 'slash'
import { RawSourceMap } from 'source-map'
import { COMMONJS_ANALYSIS_PATH } from '../constants'
import { PluginHooks } from '../plugin'
import { isNodeModule, readFile } from '../utils'
import { bundleWithEsBuild } from './esbuild'
import { printStats } from './stats'
import { traverseWithEsbuild } from './traverse'

const debug = require('debug')('esbuild')

export async function prebundle({ entryPoints, root, dest }) {
    const dependenciesPaths = await getDependenciesPaths({ entryPoints, root })

    await fs.remove(dest)
    const { bundleMap, analysis, stats } = await bundleWithEsBuild({
        dest,
        root,
        entryPoints: dependenciesPaths.map((x) => path.resolve(root, x)),
    })

    const analysisFile = path.join(dest, COMMONJS_ANALYSIS_PATH)
    await fs.createFile(analysisFile)
    // console.log({ analysis })
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 4))

    console.info(printStats(stats))
    return bundleMap
}

export async function getDependenciesPaths({ entryPoints, root }) {
    // serve react refresh runtime
    const traversalResult = await traverseWithEsbuild({
        entryPoints,
        stopTraversing: isNodeModule,
        cwd: root,
    })
    let resolvedFiles = traversalResult
        .map((x) => {
            return x.resolvedImportPath
        })
        .filter(Boolean)
        .filter((x) => isNodeModule(x))
        .map((x) => slash(path.relative(root, x)))
    resolvedFiles = Array.from(new Set(resolvedFiles))
    return resolvedFiles
}

// on start, check if already optimized dependencies, else
// traverse from entrypoints and get all imported paths, stopping when finding a node_module
// start bundling these modules and store them in a web_modules folder
// save a commonjs modules list in web_modules folder
// this can be a plugin that start building when finding a new node_modules plugin that should not be there
// if it sees a path that has a node_modules inside it blocks the server, start bundling and restart everything
