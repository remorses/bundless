import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import {
    BUNDLE_MAP_PATH,
    COMMONJS_ANALYSIS_PATH,
    pnpapi,
    WEB_MODULES_PATH,
} from '../constants'
import { logger } from '../logger'
import { clearCommonjsAnalysisCache } from '../plugins/rewrite/commonjs'
import { bundleWithEsBuild, generateDefineObject } from './esbuild'
import { printStats } from './stats'
import { isEmpty, needsPrebundle, osAgnosticPath } from '../utils'
import { traverseWithEsbuild } from './traverse'

export async function prebundle({ entryPoints, config, root, dest }) {
    try {
        logger.spinStart(`Prebundling modules in '${WEB_MODULES_PATH}'`)
        const traversalResult = await traverseWithEsbuild({
            entryPoints,
            root,
            config,
            filter: /^[\w@][^:]/, // bare name imports (no relative imports)
        })
        logger.debug(`traversed files`)

        const dependenciesPaths = traversalResult.filter((p) =>
            needsPrebundle(config, p),
        )

        await fs.remove(dest)

        if (!dependenciesPaths.length) {
            logger.log(`No dependencies to prebundle found`)
            return {}
        }

        logger.log(
            `Prebundling \n    ${dependenciesPaths
                .map((x) => getClearDependencyPath(x))
                .map((x) => (path.isAbsolute(x) ? osAgnosticPath(x, root) : x))
                .map((x) => chalk.cyanBright(x))
                .join('\n    ')}\n`,
        )

        // TODO separate build for workspaces and dependencies, build workspaces in watch mode, also pass user plugins
        // TODO do not stop traversal on workspaces, grab all dependencies including inside workspaces (to node duplicate deps)
        // TODO build workspaces in separate build step, make external dependencies using the needsPrebundle logic
        let { bundleMap, analysis, stats } = await bundleWithEsBuild({
            dest,
            root,
            config,
            entryPoints: makeEntryObject(
                dependenciesPaths.map((x) => path.resolve(root, x)),
            ),
        })

        logger.spinSucceed('\nFinish')

        const analysisFile = path.resolve(root, COMMONJS_ANALYSIS_PATH)
        await fs.createFile(analysisFile)

        await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 4))
        console.info(
            printStats({ dependencyStats: stats, destLoc: WEB_MODULES_PATH }),
        )
        if (!isEmpty(bundleMap)) {
            const bundleMapCachePath = path.resolve(root, BUNDLE_MAP_PATH)
            await fs.writeJSON(bundleMapCachePath, bundleMap, { spaces: 4 })
        }
        return bundleMap
    } catch (e) {
        logger.spinFail('Cannot prebundle\n')
        throw e
    } finally {
        clearCommonjsAnalysisCache()
    }
}

function getClearDependencyPath(p: string) {
    const index = p.lastIndexOf('node_modules')
    if (index === -1) {
        return p
    }
    let dependencySubPath = p.slice(index).replace(/\/?node_modules(\/|\\)/, '')
    return dependencySubPath
}

function getScopedPackageName(path: string): any {
    return path.match(/(@[\w-_\.]+\/[\w-_\.]+)/)?.[1] || ''
}

function getPackageName(p: string) {
    const dependencySubPath = getClearDependencyPath(p)
    let dependency = ''
    if (dependencySubPath.startsWith('@')) {
        dependency = getScopedPackageName(dependencySubPath) || ''
    } else {
        const lastIndex = dependencySubPath.indexOf('/')
        dependency = dependencySubPath.slice(
            0,
            lastIndex === -1 ? undefined : lastIndex,
        )
    }
    return dependency
}

export function makeEntryObject(dependenciesPaths: string[]) {
    const names: Record<string, number> = {}
    return Object.assign(
        {},
        ...dependenciesPaths.map((f) => {
            let outputPath = getClearDependencyPath(f) || 'unknown'
            const sameNamesCount = names[outputPath]
            if (sameNamesCount) {
                names[outputPath] += 1
                outputPath += String(sameNamesCount)
            } else {
                names[outputPath] = 1
            }

            return {
                [outputPath]: f,
            }
        }),
    )
}
