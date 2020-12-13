// const analysisCache = new Map<string, OptimizeAnalysisResult | null>()

// /**
//  * read analysis result from optimize step
//  * If we can't find analysis result, return null
//  * (maybe because user set optimizeDeps.auto to false)
//  */
// function getAnalysis(root: string): OptimizeAnalysisResult | null {
//     if (analysisCache.has(root)) return analysisCache.get(root)!
//     let analysis: OptimizeAnalysisResult | null
//     try {
//         const cacheDir = resolveOptimizedCacheDir(root)
//         analysis = fs.readJsonSync(path.join(cacheDir!, '_analysis.json'))
//     } catch (error) {
//         analysis = null
//     }
//     if (analysis && !isPlainObject(analysis.isCommonjs)) {
//         throw new Error(`[vite] invalid _analysis.json`)
//     }
//     analysisCache.set(root, analysis)
//     return analysis
// }

// function isOptimizedCjs(root: string, importer: string, id: string) {
//     const analysis = getAnalysis(root)
//     if (!analysis) return false
//     const modulePath = resolveNodeModuleFile(importer, id)
//     if (!modulePath) {
//         return false
//     }
//     return !!analysis.isCommonjs[slash(path.relative(root, modulePath))]
// }

// type ImportNameSpecifier = { importedName: string; localName: string }

export function transformCjsImport(
    exp: string,
    id: string,
    resolvedPath: string,
    importIndex: number,
): string {
    return ''
    // const ast = parse(exp)[0] as ImportDeclaration
    // const importNames: ImportNameSpecifier[] = []

    // ast.specifiers.forEach((obj) => {
    //     if (
    //         obj.type === 'ImportSpecifier' &&
    //         obj.imported.type === 'Identifier'
    //     ) {
    //         const importedName = obj.imported.name
    //         const localName = obj.local.name
    //         importNames.push({ importedName, localName })
    //     } else if (obj.type === 'ImportDefaultSpecifier') {
    //         importNames.push({
    //             importedName: 'default',
    //             localName: obj.local.name,
    //         })
    //     } else if (obj.type === 'ImportNamespaceSpecifier') {
    //         importNames.push({ importedName: '*', localName: obj.local.name })
    //     }
    // })

    // return generateCjsImport(importNames, id, resolvedPath, importIndex)
}

// function generateCjsImport(
//     importNames: ImportNameSpecifier[],
//     id: string,
//     resolvedPath: string,
//     importIndex: number,
// ): string {
//     // If there is multiple import for same id in one file,
//     // importIndex will prevent the cjsModuleName to be duplicate
//     const cjsModuleName = makeLegalIdentifier(
//         `$viteCjsImport${importIndex}_${id}`,
//     )
//     const lines: string[] = [`import ${cjsModuleName} from "${resolvedPath}";`]
//     importNames.forEach(({ importedName, localName }) => {
//         if (importedName === '*' || importedName === 'default') {
//             lines.push(`const ${localName} = ${cjsModuleName};`)
//         } else {
//             lines.push(
//                 `const ${localName} = ${cjsModuleName}["${importedName}"];`,
//             )
//         }
//     })
//     return lines.join('\n')
// }
