
// import { Expression, Node, Statement, StringLiteral } from '@babel/types'
// import chalk from 'chalk'
// import { FSWatcher } from 'chokidar'
// import LRUCache from 'lru-cache'
// import MagicString from 'magic-string'
// import { HMRPayload } from '../../hmrPayload'
// import { InternalResolver } from '../resolver'
// import { resolveCompiler } from '../utils'
// import { parse } from '../utils/babelParse'
// import { resolveImport } from './serverPluginModuleRewrite'

// export const debugHmr = require('debug')('vite:hmr')

// export type HMRWatcher = FSWatcher & {
//     handleVueReload: (
//         filePath: string,
//         timestamp?: number,
//         content?: string,
//     ) => void
//     handleJSReload: (filePath: string, timestamp?: number) => void
//     send: (payload: HMRPayload) => void
// }

// // while we lex the files for imports we also build a import graph
// // so that we can determine what files to hot reload
// type HMRStateMap = Map<string, Set<string>>

// export const hmrAcceptanceMap: HMRStateMap = new Map()
// export const hmrDeclineSet = new Set<string>()
// export const importerMap: HMRStateMap = new Map()
// export const importeeMap: HMRStateMap = new Map()

// // files that are dirty (i.e. in the import chain between the accept boundary
// // and the actual changed file) for an hmr update at a given timestamp.
// export const hmrDirtyFilesMap = new LRUCache<string, Set<string>>({ max: 10 })
// export const latestVersionsMap = new Map<string, string>()


// function isHmrAccepted(importer: string, dep: string): boolean {
//     const deps = hmrAcceptanceMap.get(importer)
//     return deps ? deps.has(dep) : false
// }

// export function ensureMapEntry(map: HMRStateMap, key: string): Set<string> {
//     let entry = map.get(key)
//     if (!entry) {
//         entry = new Set<string>()
//         map.set(key, entry)
//     }
//     return entry
// }

// export function rewriteFileWithHMR(
//     root: string,
//     source: string,
//     importer: string,
//     resolver: InternalResolver,
//     s: MagicString,
// ) {
//     let hasDeclined = false

//     const registerDep = (e: StringLiteral) => {
//         const deps = ensureMapEntry(hmrAcceptanceMap, importer)
//         const depPublicPath = resolveImport(root, importer, e.value, resolver)
//         deps.add(depPublicPath)
//         debugHmr(`        ${importer} accepts ${depPublicPath}`)
//         ensureMapEntry(importerMap, depPublicPath).add(importer)
//         s.overwrite(e.start!, e.end!, JSON.stringify(depPublicPath))
//     }

//     const checkHotCall = (
//         node: Expression,
//         isTopLevel: boolean,
//         isDevBlock: boolean,
//     ) => {
//         if (
//             node.type === 'CallExpression' &&
//             node.callee.type === 'MemberExpression' &&
//             isMetaHot(node.callee.object)
//         ) {
//             if (isTopLevel) {
//                 const { generateCodeFrame } = resolveCompiler(root)
//                 console.warn(
//                     chalk.yellow(
//                         `HMR syntax error in ${importer}: import.meta.hot.accept() ` +
//                             `should be wrapped in \`if (import.meta.hot) {}\` conditional ` +
//                             `blocks so that they can be tree-shaken in production.`,
//                     ),
//                 )
//                 console.warn(
//                     chalk.yellow(
//                         generateCodeFrame(source, node.start!, node.end!),
//                     ),
//                 )
//             }

//             const method =
//                 node.callee.property.type === 'Identifier' &&
//                 node.callee.property.name
//             if (method === 'accept' || method === 'acceptDeps') {
//                 if (!isDevBlock) {
//                     console.error(
//                         chalk.yellow(
//                             `HMR syntax error in ${importer}: import.meta.hot.${method}() ` +
//                                 `cannot be conditional except for \`if (import.meta.hot)\` check ` +
//                                 `because the server relies on static analysis to construct the HMR graph.`,
//                         ),
//                     )
//                 }
//                 // register the accepted deps
//                 const accepted = node.arguments[0]
//                 if (accepted && accepted.type === 'ArrayExpression') {
//                     if (method !== 'acceptDeps') {
//                         console.error(
//                             chalk.yellow(
//                                 `HMR syntax error in ${importer}: hot.accept() only accepts ` +
//                                     `a single callback. Use hot.acceptDeps() to handle dep updates.`,
//                             ),
//                         )
//                     }
//                     // import.meta.hot.accept(['./foo', './bar'], () => {})
//                     accepted.elements.forEach((e) => {
//                         if (e && e.type !== 'StringLiteral') {
//                             console.error(
//                                 chalk.yellow(
//                                     `HMR syntax error in ${importer}: hot.accept() deps ` +
//                                         `list can only contain string literals.`,
//                                 ),
//                             )
//                         } else if (e) {
//                             registerDep(e)
//                         }
//                     })
//                 } else if (accepted && accepted.type === 'StringLiteral') {
//                     if (method !== 'acceptDeps') {
//                         console.error(
//                             chalk.yellow(
//                                 `HMR syntax error in ${importer}: hot.accept() only accepts ` +
//                                     `a single callback. Use hot.acceptDeps() to handle dep updates.`,
//                             ),
//                         )
//                     }
//                     // import.meta.hot.accept('./foo', () => {})
//                     registerDep(accepted)
//                 } else if (
//                     !accepted ||
//                     accepted.type.endsWith('FunctionExpression')
//                 ) {
//                     if (method !== 'accept') {
//                         console.error(
//                             chalk.yellow(
//                                 `HMR syntax error in ${importer}: hot.acceptDeps() ` +
//                                     `expects a dependency or an array of dependencies. ` +
//                                     `Use hot.accept() for handling self updates.`,
//                             ),
//                         )
//                     }
//                     // self accepting
//                     // import.meta.hot.accept() OR import.meta.hot.accept(() => {})
//                     ensureMapEntry(hmrAcceptanceMap, importer).add(importer)
//                     debugHmr(`${importer} self accepts`)
//                 } else {
//                     console.error(
//                         chalk.yellow(
//                             `HMR syntax error in ${importer}: ` +
//                                 `import.meta.hot.accept() expects a dep string, an array of ` +
//                                 `deps, or a callback.`,
//                         ),
//                     )
//                 }
//             }

//             if (method === 'decline') {
//                 hasDeclined = true
//                 hmrDeclineSet.add(importer)
//             }
//         }
//     }

//     const checkStatements = (
//         node: Statement,
//         isTopLevel: boolean,
//         isDevBlock: boolean,
//     ) => {
//         if (node.type === 'ExpressionStatement') {
//             // top level hot.accept() call
//             checkHotCall(node.expression, isTopLevel, isDevBlock)
//         }
//         // if (import.meta.hot) ...
//         if (node.type === 'IfStatement') {
//             const isDevBlock = isMetaHot(node.test)
//             if (node.consequent.type === 'BlockStatement') {
//                 node.consequent.body.forEach((s) =>
//                     checkStatements(s, false, isDevBlock),
//                 )
//             }
//             if (node.consequent.type === 'ExpressionStatement') {
//                 checkHotCall(node.consequent.expression, false, isDevBlock)
//             }
//         }
//     }

//     const ast = parse(source)
//     ast.forEach((s) => checkStatements(s, true, false))

//     // inject import.meta.hot
//     s.prepend(
//         `import { createHotContext } from "${clientPublicPath}"; ` +
//             `import.meta.hot = createHotContext(${JSON.stringify(importer)}); `,
//     )

//     // clear decline state
//     if (!hasDeclined) {
//         hmrDeclineSet.delete(importer)
//     }
// }

// function isMetaHot(node: Node) {
//     return (
//         node.type === 'MemberExpression' &&
//         node.object.type === 'MetaProperty' &&
//         node.property.type === 'Identifier' &&
//         node.property.name === 'hot'
//     )
// }
