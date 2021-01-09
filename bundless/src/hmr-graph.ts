import path from 'path'
import WebSocket from 'ws'
import net from 'net'
import chalk from 'chalk'
import { osAgnosticPath } from './utils'
import { fileToImportPath, importPathToFile } from './utils'
import { HMRPayload } from './client/types'
import { logger } from './logger'
import {} from './utils'
import { HMR_SERVER_NAME } from './constants'

// examples are ./main.js and ../folder/main.js
type OsAgnosticPath = string

// examples are /path/file.js or /.../file.js
type ImportPath = string
export interface HmrNode {
    importers(): Set<OsAgnosticPath> // returns osAgnosticPaths
    importees: Set<ImportPath>
    dirtyImportersCount: number // modules that have imported this and have been updated
    lastUsedTimestamp: number
    isHmrEnabled?: boolean
    hasHmrAccept?: boolean
}

export class HmrGraph {
    // keys are always os agnostic paths and not public paths
    nodes: { [osAgnosticPath: string]: HmrNode } = {}
    root
    wss: WebSocket.Server
    server: net.Server

    constructor({ root, server }: { root: string; server: net.Server }) {
        this.nodes = {}
        this.root = root
        this.server = server

        const wss = new WebSocket.Server({ noServer: true })
        this.wss = wss
        server.once('close', () => {
            wss.close(() => logger.debug('closing wss'))
            wss.clients.forEach((client) => {
                client.close()
            })
        })
        server.on('upgrade', (req, socket, head) => {
            if (req.headers['sec-websocket-protocol'] === HMR_SERVER_NAME) {
                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit('connection', ws, req)
                })
            }
        })

        wss.on('connection', (socket) => {
            socket.send(JSON.stringify({ type: 'connected' }))
            socket.on('message', (data) => {
                const message: HMRPayload = JSON.parse(data.toString())
                if (message.type === 'hotAccept') {
                    this.ensureEntry(importPathToFile(root, message.path), {
                        hasHmrAccept: true,
                        isHmrEnabled: true,
                    })
                }
            })
        })

        wss.on('error', (e: Error & { code: string }) => {
            if (e.code !== 'EADDRINUSE') {
                console.error(chalk.red(`WebSocket server error:`))
                console.error(e)
            }
        })
    }

    sendHmrMessage(payload: HMRPayload) {
        if (!this.wss) {
            throw new Error(`HMR Websocket server has not started yet`)
        }
        const stringified = JSON.stringify(payload, null, 4)
        logger.debug(`hmr: ${stringified}`)
        if (!this.wss.clients.size) {
            logger.debug(`No clients listening for HMR message`)
        }
        let clientIndex = 1
        for (let client of this.wss.clients.values()) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(stringified)
            } else {
                logger.log(
                    chalk.red(
                        `Cannot send HMR message, hmr client ${clientIndex} is not open`,
                    ),
                )
            }
            clientIndex += 1
        }
    }

    ensureEntry(path: string, newNode?: Partial<HmrNode>): HmrNode {
        path = osAgnosticPath(path, this.root)
        if (this.nodes[path]) {
            Object.assign(this.nodes[path], newNode || {})
            return this.nodes[path]
        }

        this.nodes[path] = {
            dirtyImportersCount: 0,
            lastUsedTimestamp: 0,
            hasHmrAccept: false,
            isHmrEnabled: false,
            importees: new Set(),
            ...newNode,
            importers: () => {
                const importPath = fileToImportPath(this.root, path)
                return new Set(
                    Object.entries(this.nodes)
                        .filter(([_, v]) => {
                            return v.importees?.has(importPath)
                        })
                        .map(([k, _]) => k),
                )
            },
        }
        return this.nodes[path]
    }
    toString() {
        const content = Object.keys(this.nodes)
            .map((k) => {
                const node = this.nodes[k]
                let key = path.relative(process.cwd(), k)

                if (node.hasHmrAccept) {
                    key = chalk.redBright(chalk.underline(key))
                } else if (node.isHmrEnabled) {
                    key = chalk.yellow(chalk.underline(key))
                }

                key += ' ' + chalk.cyan(node.dirtyImportersCount)
                return `    ${key} -> ${JSON.stringify(
                    [...node.importees],
                    null,
                    4,
                )
                    .split('\n')
                    .map((x) => '    ' + x)
                    .join('\n')
                    .trim()}`
            })
            .join('\n')
        const legend =
            `\nLegend:\n` +
            // `${'[ ]'} has no HMR\n` +
            `${chalk.redBright('[ ]')} accepts HMR\n` +
            `${chalk.yellow('[ ]')} HMR enabled\n\n`
        return legend + `ImportGraph {\n${content}\n}\n`
    }

    // TODO maybe rewrite should happen before to prune the graph from removed imports? in case old imports remain in the graph what could happen? the hmr algo only depend on the importers, this means that the worst thing could be that a non importer could be updated, but this is impossible because the only changed imports can only be the ones in the updated file, this means that only the current file imports could be invalid, which means that changed files importers will always be valid
    // TODO to make this work for vue and vite, i need to support virtual files, vite files will be rewritten as js files with imports of virtual css files, the current implementation will see the change in the vite file, but it cannot know about changed virtual files, maybe i can put a property in the result of onTransform or onLoad to say `computedFiles: [virtualFile]`, save this info in graph (taken during rewrite) and in onChange i can send an update to these dependent modules too
    async onFileChange({ filePath }: { filePath: string }) {
        const graph = this

        const root = this.root

        const initialRelativePath = osAgnosticPath(filePath, root)

        const toVisit: string[] = [initialRelativePath]
        const visited: string[] = []
        const messages: HMRPayload[] = []

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
                this.sendHmrMessage({ type: 'reload' })
                continue
            }
            // trigger an update if the module is able to handle it
            if (node.isHmrEnabled) {
                messages.push({
                    type: 'update',
                    namespace: 'file',
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
                this.sendHmrMessage({ type: 'reload' })
                continue
            }
            for (let importer of importers) {
                graph.ensureEntry(importer)
                // mark module as dirty, importers will refetch this module to see updates
                node.dirtyImportersCount++
            }
            toVisit.push(...importers)
        }
        messages.forEach((m) => this.sendHmrMessage(m))
    }
}
