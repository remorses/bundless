import { isPlainObject } from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import { COMMONJS_ANALYSIS_PATH, WEB_MODULES_PATH } from '../../constants'
import slash from 'slash'
import { ImportDeclaration } from '@babel/types'
import { parse } from '../../utils'
import { makeLegalIdentifier } from '@rollup/pluginutils'
import { osAgnosticPath } from '../../prebundle/support'
import memoize from 'micro-memoize'
import { onResolveLock } from '../../serve'
import { logger } from '../../logger'

export interface OptimizeAnalysisResult {
    isCommonjs: { [name: string]: true }
}

/**
 * read analysis result from optimize step
 * If we can't find analysis result, return null
 * (maybe because user set optimizeDeps.auto to false)
 */
export const getAnalysis = memoize(function getAnalysis(
    root: string,
): OptimizeAnalysisResult | null {
    let analysis: OptimizeAnalysisResult | null
    try {
        analysis = fs.readJsonSync(
            path.resolve(root, WEB_MODULES_PATH, COMMONJS_ANALYSIS_PATH),
        )
    } catch (error) {
        logger.debug(
            `Cannot find commonjs analysis at ${path.resolve(
                root,
                WEB_MODULES_PATH,
                COMMONJS_ANALYSIS_PATH,
            )}`,
        )
        analysis = null
    }
    if (analysis && !isPlainObject(analysis.isCommonjs)) {
        throw new Error(`invalid ${COMMONJS_ANALYSIS_PATH}`)
    }
    logger.debug(
        `Got new commonjs analysis: ${JSON.stringify(
            analysis?.isCommonjs,
            null,
            4,
        )}`,
    )
    return analysis
})

export function clearCommonjsAnalysisCache() {
    logger.debug(`Invalidating commonjs cache`)
    getAnalysis.cache.keys.length = 0
    getAnalysis.cache.values.length = 0
}

export function isOptimizedCjs(root: string, filename: string) {
    if (!onResolveLock.isReady) {
        throw new Error(
            `Cannot call isOptimizedCjs when onResolveLock is locked!`,
        )
    }
    const analysis = getAnalysis(root)
    if (!analysis) {
        return false
    }
    const isCommonjs = !!analysis.isCommonjs[osAgnosticPath(filename, root)]
    return isCommonjs
}

type ImportNameSpecifier = { importedName: string; localName: string }

// todo if module has __esModule and there is only a default import, transform to .default, -> const imported = realImport.__esModule ? realImport.default : realImport
export function transformCjsImport(
    exp: string,
    id: string,
    resolvedPath: string,
    importIndex: number,
): string {
    const ast = parse(exp)[0] as ImportDeclaration
    const importNames: ImportNameSpecifier[] = []

    ast.specifiers.forEach((obj) => {
        if (
            obj.type === 'ImportSpecifier' &&
            obj.imported.type === 'Identifier'
        ) {
            const importedName = obj.imported.name
            const localName = obj.local.name
            importNames.push({ importedName, localName })
        } else if (obj.type === 'ImportDefaultSpecifier') {
            importNames.push({
                importedName: 'default',
                localName: obj.local.name,
            })
        } else if (obj.type === 'ImportNamespaceSpecifier') {
            importNames.push({ importedName: '*', localName: obj.local.name })
        }
    })

    return generateCjsImport(importNames, id, resolvedPath, importIndex)
}

function generateCjsImport(
    importNames: ImportNameSpecifier[],
    id: string,
    resolvedPath: string,
    importIndex: number,
): string {
    // If there is multiple import for same id in one file,
    // importIndex will prevent the cjsModuleName to be duplicate
    const cjsModuleName = makeLegalIdentifier(`${id}_cjsImport${importIndex}`)
    const lines: string[] = [`import ${cjsModuleName} from "${resolvedPath}";`]
    importNames.forEach(({ importedName, localName }) => {
        if (importedName === '*' || importedName === 'default') {
            lines.push(
                `const ${localName} = ${cjsModuleName} && ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName};`,
            )
        } else {
            lines.push(
                `const ${localName} = ${cjsModuleName}["${importedName}"];`,
            )
        }
    })
    return lines.join('\n')
}
