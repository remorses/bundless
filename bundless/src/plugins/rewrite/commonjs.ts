import { ImportDeclaration } from '@babel/types'
import fs from 'fs-extra'
import { isPlainObject } from 'lodash'
import memoize from 'micro-memoize'
import path from 'path'
import { COMMONJS_ANALYSIS_PATH, WEB_MODULES_PATH } from '../../constants'
import { logger } from '../../logger'
import { onResolveLock } from '../../serve'
import { makeLegalIdentifier, osAgnosticPath, parse } from '../../utils'

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
        analysis = fs.readJsonSync(path.resolve(root, COMMONJS_ANALYSIS_PATH))
    } catch (error) {
        logger.debug(
            `Cannot find commonjs analysis at ${path.resolve(
                root,
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
    const importNames = getImportNames(ast)
    return generateCjsImport(importNames, id, resolvedPath, importIndex)
}

function getImportNames(ast: ImportDeclaration) {
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
    return importNames
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
        // __esModule means the module has been compiled from ESM: ESM -> commonjs -> ESM
        // we consider commonjs all modules with only a default export, but if the module has been compiled from ESM, it will contain double default export: default.default
        if (importedName === 'default') {
            lines.push(
                `const ${localName} = ${cjsModuleName} && ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName};`,
            )
        } else if (importedName === '*') {
            lines.push(
                `const ${localName} = {default: ${cjsModuleName}, ...(typeof ${cjsModuleName} === 'object' && ${cjsModuleName})};`,
            )
        } else {
            lines.push(
                `const ${localName} = ${cjsModuleName}["${importedName}"];`,
            )
        }
    })
    return lines.join(' ')
}

// adds the default export to the namespace in case this is an iterable object, this is to support the case `import * as namespace from 'mod'; namespace.default()`
// TODO namespace imports can be polluted in case default import is an object and user is doing import * on a ES module with only a default export, this can be solved adding isCommonjs to esbuild metafile
export function generateNamespaceExport(mId: string) {
    return `({...${mId}, ...(${mId}.default instanceof Object && ${mId}.default.constructor === Object && m.default)})`
}
