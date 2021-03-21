import fs from 'fs-extra'
import path from 'path'
import {
    BUNDLE_MAP_PATH,
    COMMONJS_ANALYSIS_PATH,
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
        const traversalResult = await traverseWithEsbuild({
            entryPoints,
            root,
            config,
            filter: /^[\w@][^:]/, // bare name imports (no relative imports)
        })

        const dependenciesPaths = traversalResult.filter((p) =>
            needsPrebundle(config, p),
        )

        await fs.remove(dest)

        if (!dependenciesPaths.length) {
            logger.log(`No dependencies to prebundle found`)
            return {}
        }

        logger.spinStart('Prebundling modules')
        logger.log(
            `prebundling [\n    ${dependenciesPaths
                .map((x) => osAgnosticPath(x, root))
                .join('\n    ')}\n]`,
        )

        // TODO separate build for workspaces and dependencies, build workspaces in watch mode, also pass user plugins
        // TODO do not stop traversal on workspaces, grab all dependencies including inside workspaces (to node duplicate deps)
        // TODO build workspaces in separate build step, make external dependencies using the needsPrebundle logic
        const { bundleMap, analysis, stats } = await bundleWithEsBuild({
            dest,
            root,
            config,
            entryPoints: dependenciesPaths.map((x) => path.resolve(root, x)), // TODO resolve to package names
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
        logger.spinFail(String(e) + '\n')
        e.message = `Cannot prebundle: ${e.message}`
        throw e
    } finally {
        clearCommonjsAnalysisCache()
    }
}

// on start, check if already optimized dependencies, else
// traverse from entrypoints and get all imported paths, stopping when finding a node_module
// start bundling these modules and store them in a web_modules folder
// save a commonjs modules list in web_modules folder
// this can be a plugin that start building when finding a new node_modules plugin that should not be there
// if it sees a path that has a node_modules inside it blocks the server, start bundling and restart everything
