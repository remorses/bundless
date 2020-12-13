import { isPlainObject } from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import { COMMONJS_ANALYSIS_PATH, WEB_MODULES_PATH } from '../../constants'
import slash from 'slash'
import { ImportDeclaration } from '@babel/types'
import { parse } from '../../utils'
import { makeLegalIdentifier } from '@rollup/pluginutils'

const analysisCache = new Map<string, OptimizeAnalysisResult | null>()

export interface OptimizeAnalysisResult {
    isCommonjs: { [name: string]: true }
}

/**
 * read analysis result from optimize step
 * If we can't find analysis result, return null
 * (maybe because user set optimizeDeps.auto to false)
 */
function getAnalysis(root: string): OptimizeAnalysisResult | null {
    if (analysisCache.has(root)) return analysisCache.get(root)!
    let analysis: OptimizeAnalysisResult | null
    try {
        const cacheDir = path.resolve(root, WEB_MODULES_PATH)
        analysis = fs.readJsonSync(path.join(cacheDir!, COMMONJS_ANALYSIS_PATH))
    } catch (error) {
        analysis = null
    }
    if (analysis && !isPlainObject(analysis.isCommonjs)) {
        throw new Error(`[vite] invalid ${COMMONJS_ANALYSIS_PATH}`)
    }
    analysisCache.set(root, analysis)
    return analysis
}

export function isOptimizedCjs(root: string, filename: string) {
    console.log(`isOptimizedCjs ${filename}`)
    const analysis = getAnalysis(root)
    if (!analysis) return false
    return !!analysis.isCommonjs[slash(path.relative(root, filename))]
}

type ImportNameSpecifier = { importedName: string; localName: string }

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
    const cjsModuleName = makeLegalIdentifier(
        `$viteCjsImport${importIndex}_${id}`,
    )
    const lines: string[] = [`import ${cjsModuleName} from "${resolvedPath}";`]
    importNames.forEach(({ importedName, localName }) => {
        if (importedName === '*' || importedName === 'default') {
            lines.push(`const ${localName} = ${cjsModuleName};`)
        } else {
            lines.push(
                `const ${localName} = ${cjsModuleName}["${importedName}"];`,
            )
        }
    })
    return lines.join('\n')
}
