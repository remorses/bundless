import { logger } from '../logger'
import WebSocket from 'ws'
import { ServerMiddleware } from '../serve'
import { importPathToFile, isImportRequest, isStaticAsset } from '../utils'
import { HMR_SERVER_NAME } from '../constants'
import { HMRPayload } from '../client/types'
import chalk from 'chalk'

export const hmrMiddleware: ServerMiddleware = (context) => {
    const { app, graph, root } = context
    const wss = new WebSocket.Server({ noServer: true })
    let done = false
    app.use((_, next) => {
        if (done) {
            return next()
        }
        app.once('close', () => {
            wss.close(() => logger.debug('closing wss'))
            wss.clients.forEach((client) => {
                client.close()
            })
        })
        if (!app.context.server) {
            throw new Error(`Cannot find server in context`)
        }
        app.context.server.on('upgrade', (req, socket, head) => {
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
                    graph.ensureEntry(importPathToFile(root, message.path), {
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

        context.sendHmrMessage = (payload: HMRPayload) => {
            const stringified = JSON.stringify(payload, null, 4)
            logger.log(`hmr: ${stringified}`)

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(stringified)
                }
            })
        }
        done = true
        return next()
    })
}
