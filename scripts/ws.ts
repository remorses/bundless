import WebSocket from 'ws'
import { once } from 'events'
import { serve } from 'espack'

const PORT = 4000

async function main() {
    await serve({ root: __dirname, port: PORT, openBrowser: true })
    const ws = new WebSocket(`ws://localhost:${PORT}`, 'esm-hmr')
    await once(ws, 'open')
    ws.addEventListener('message', ({ data }) => {
        const payload = JSON.parse(data)
        console.log('msg', data)
        if (payload.type === 'connected') return
        if (payload.type === 'multi') {
        }
    })
}

main()
