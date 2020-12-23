import { HMRPayload } from './client/types'
import { Graph } from './graph'
import { logger } from './logger'
import { osAgnosticPath } from './prebundle/support'
import { fileToImportPath, importPathToFile } from './utils'

// TODO maybe rewrite should happen before to prune the graph from removed imports? in case old imports remain in the graph what could happen? the hmr algo only depend on the importers, this means that the worst thing could be that a non importer could be updated, but this is impossible because the only changed imports can only be the ones in the updated file, this means that only the current file imports could be invalid, which means that changed files importers will always be valid
export async function onFileChange({
    graph,
    root,
    filePath,
    sendHmrMessage,
}: {
    graph: Graph
    root: string
    filePath: string
    sendHmrMessage: (x: HMRPayload) => any
}) {
    const initialRelativePath = osAgnosticPath(filePath, root)

    const toVisit: string[] = [initialRelativePath]
    const visited: string[] = []
    const messages: any[] = []

    while (toVisit.length) {
        const relativePath = toVisit.shift()
        if (!relativePath || visited.includes(relativePath)) {
            continue
        }
        const importPath = fileToImportPath(root, relativePath)
        visited.push(relativePath)
        const node = graph.nodes[relativePath]
        // can be a non js file, like index.html
        if (!node) {
            logger.log(
                `node for '${relativePath}' not found in graph, reloading`,
            )
            sendHmrMessage({ type: 'reload' })
            continue
        }
        // trigger an update if the module is able to handle it
        if (node.isHmrEnabled) {
            messages.push({
                type: 'update',
                path: importPath,
                updateID: ++node.lastUsedTimestamp,
            })
        }
        // reached a boundary, stop hmr propagation
        if (node.hasHmrAccept) {
            continue
        }
        const importers = node.importers()
        // reached another boundary, reload
        if (!importers.size) {
            logger.log(`reached top boundary '${relativePath}', reloading`)
            sendHmrMessage({ type: 'reload' })
            continue
        }
        for (let importer of importers) {
            graph.ensureEntry(importer)
            // mark module as dirty, importers will refetch this module to see updates
            node.dirtyImportersCount++
        }
        toVisit.push(...importers)
    }
    messages.forEach(sendHmrMessage)
}
