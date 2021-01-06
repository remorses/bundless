// This file runs in the browser.

// injected by serverPluginClient when served
declare const __HMR_PROTOCOL__: string
declare const __HMR_HOSTNAME__: string
declare const __HMR_PORT__: string
declare const __HMR_TIMEOUT__: number
declare const __MODE__: string
declare const __HMR_ENABLE_OVERLAY__: boolean
declare const __DEFINES__: Record<string, any>
;(window as any).process = (window as any).process || {}
;(window as any).process.env = (window as any).process.env || {}
;(window as any).process.env.NODE_ENV = __MODE__

const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
    const segs = key.split('.')
    let target = window as any
    for (let i = 0; i < segs.length; i++) {
        const seg = segs[i]
        if (i === segs.length - 1) {
            target[seg] = defines[key]
        } else {
            target = target[seg] || (target[seg] = {})
        }
    }
})

import {
    OverlayErrorPayload,
    HMRPayload,
    UpdatePayload,
    OverlayInfoOpenPayload,
} from './types'

// use server configuration, then fallback to inference
const socketProtocol =
    __HMR_PROTOCOL__ || (location.protocol === 'https:' ? 'wss' : 'ws')
const socketHost = `${__HMR_HOSTNAME__ || location.hostname}:${__HMR_PORT__}`
const socketURL = `${socketProtocol}://${socketHost}`

const isWindowDefined = typeof window !== 'undefined'

function log(...args) {
    console.info('[ESM-HMR]', ...args)
}

function reload() {
    if (!isWindowDefined) {
        return
    }
    location.reload(true)
}

let SOCKET_MESSAGE_QUEUE: HMRPayload[] = []
let connected = false
function _sendSocketMessage(msg) {
    socket.send(JSON.stringify(msg))
}
function sendSocketMessage(msg: HMRPayload) {
    if (!connected) {
        SOCKET_MESSAGE_QUEUE.push(msg)
    } else {
        _sendSocketMessage(msg)
    }
}

const socket = new WebSocket(socketURL, 'esm-hmr')

const REGISTERED_MODULES: { [path: string]: HotModuleState } = {}
class HotModuleState {
    data = {}
    isLocked = false
    isDeclined = false
    isAccepted = false
    acceptCallbacks: { deps: string[]; callback: Function }[] = []
    disposeCallbacks: Function[] = []
    path = ''
    constructor(path) {
        this.path = path
    }
    lock() {
        this.isLocked = true
    }
    dispose(callback) {
        this.disposeCallbacks.push(callback)
    }
    invalidate() {
        reload()
    }
    decline() {
        this.isDeclined = true
    }
    accept(_deps, callback: Function | true = true) {
        if (this.isLocked) {
            return
        }
        if (!this.isAccepted) {
            sendSocketMessage({ path: this.path, type: 'hotAccept' })
            this.isAccepted = true
        }
        if (!Array.isArray(_deps)) {
            callback = _deps || callback
            _deps = []
        }
        if (callback === true) {
            callback = () => {}
        }
        const deps = _deps.map((dep) => {
            return new URL(dep, `${window.location.origin}${this.path}`)
                .pathname
        })
        this.acceptCallbacks.push({
            deps,
            callback,
        })
    }
}
export function createHotContext(fullUrl) {
    const id = new URL(fullUrl).pathname
    const existing = REGISTERED_MODULES[id]
    if (existing) {
        existing.lock()
        runModuleDispose(id)
        return existing
    }
    const state = new HotModuleState(id)
    REGISTERED_MODULES[id] = state
    return state
}

/** Called when a new module is loaded, to pass the updated module to the "active" module */
// uses the graph lastUsedTimestamp to make the new timestamp to fetch, pass this in the hmr message?
async function runModuleAccept({ path, namespace, updateID }: UpdatePayload) {
    const state = REGISTERED_MODULES[path]
    if (!state) {
        log(`${path} has not been registered, reloading`)
        log(Object.keys(REGISTERED_MODULES))
        return false
    }
    if (state.isDeclined) {
        log(`${path} has declined HMR, reloading`)
        return false
    }
    const acceptCallbacks = state.acceptCallbacks

    for (const { deps, callback: acceptCallback } of acceptCallbacks) {
        const encodedNamespace = encodeURIComponent(namespace || 'file')
        const [module, ...depModules] = await Promise.all([
            import(
                appendQuery(path, `namespace=${encodedNamespace}&t=${updateID}`)
            ),
            ...deps.map((d) =>
                import(appendQuery(d, `t=${Date.now()}&namespace=file`)),
            ), // TODO deps should have the namespace and their update ids too, how?
        ])
        acceptCallback({ module, deps: depModules })
    }
    return true
}

/** Called when a new module is loaded, to run cleanup on the old module (if needed) */
async function runModuleDispose(id) {
    const state = REGISTERED_MODULES[id]
    if (!state) {
        return false
    }
    if (state.isDeclined) {
        return false
    }
    const disposeCallbacks = state.disposeCallbacks
    state.disposeCallbacks = []
    state.data = {}
    disposeCallbacks.map((callback) => callback())
    return true
}

socket.addEventListener('message', ({ data: _data }) => {
    if (!_data) {
        return
    }
    const data: HMRPayload = JSON.parse(_data)
    if (data.type === 'connected') {
        connected = true
        SOCKET_MESSAGE_QUEUE.forEach(_sendSocketMessage)
        SOCKET_MESSAGE_QUEUE = []
        setInterval(
            () => socket.send(JSON.stringify({ type: 'ping' })),
            __HMR_TIMEOUT__,
        )
        return
    }
    if (data.type === 'reload') {
        log('message: reload')
        reload()
        return
    }
    if (data.type === 'overlay-error') {
        log('message: error')
        InfoOverlay.clear()
        ErrorOverlay.show(data.err)
        return
    }
    if (data.type === 'overlay-info-open') {
        log('message: info open')
        ErrorOverlay.clear()
        InfoOverlay.show({ ...data.info, stack: '' })
        return
    }
    if (data.type === 'overlay-info-close') {
        log('message: info close')
        InfoOverlay.clear()
        return
    }
    if (data.type === 'update') {
        // TODO reload if error overly is open
        log('message: update', data)
        runModuleAccept(data)
            .then((ok) => {
                if (ok) {
                    ErrorOverlay.clear()
                    InfoOverlay.clear()
                } else {
                    reload()
                }
            })
            .catch((err) => {
                console.error('[ESM-HMR] Hot Update Error', err)
                // A failed import gives a TypeError, but invalid ESM imports/exports give a SyntaxError.
                // Failed build results already get reported via a better WebSocket update.
                // We only want to report invalid code like a bad import that doesn't exist.
                if (err instanceof SyntaxError) {
                    ErrorOverlay.show({
                        message: `Hot Update Error for ${data.path}: ${err.message}`,
                        stack: err.stack || '',
                    })
                }
            })
        return
    }
    log('message: unknown', data)
})
log('listening for file changes...')

/** Runtime error reporting: If a runtime error occurs, show it in an overlay. */
if (isWindowDefined) {
    window.addEventListener('error', function(event) {
        const err: OverlayErrorPayload['err'] = {
            message: `${event.message}`,
            loc: {
                file: event.filename,
                column: event.colno,
                line: event.lineno,
            },
            stack: event.error ? event.error.stack : '',
        }
        ErrorOverlay.show(err)
    })
}

const enableOverlay = __HMR_ENABLE_OVERLAY__

function appendQuery(url: string, query: string) {
    if (query.startsWith('?')) {
        query = query.slice(1)
    }
    if (url.includes('?')) {
        return url + query
    }
    return `${url}?${query}`
}

const template = ({ mainColor, tip = '' }) => /*html*/ `
<style>
:host {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: #d8d8d8;
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: #000;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,20,0.01), 0 15px 12px rgba(0,0,20,0.1);
  overflow: hidden;
  border-top: 8px solid var(${mainColor});
  min-height: 200px;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(${mainColor});
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
<div class="window">
  <pre class="message"><span class="plugin"></span><span class="message-body"></span></pre>
  <pre class="file"></pre>
  <pre class="frame"></pre>
  <pre class="stack"></pre>
  ${tip &&
      `<div class="tip">
        ${tip}
        </div>
  `}
</div>
`

const codeframeRE = /^(?:>?\s+\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm

class CommonOverlay extends HTMLElement {
    root?: ShadowRoot
    static overlayId: string = 'overlay'

    static show(arg) {
        if (!enableOverlay) return
        this.clear()
        // @ts-ignore
        document.body.appendChild(new this(arg))
    }

    static clear() {
        document
            .querySelectorAll(this.overlayId)
            .forEach((n) => (n as ErrorOverlay).close())
    }

    close() {
        this.parentNode?.removeChild(this)
    }

    displayText(selector: string, text: string, linkFiles = false) {
        const el = this.root!.querySelector(selector)!
        if (!linkFiles) {
            el.textContent = text
        } else {
            const matches = getAllMatches(text, /(https?:\/\/.*)/g)
            for (let { frag, matched } of matches) {
                el.appendChild(document.createTextNode(frag))
                const link = document.createElement('a')
                link.textContent = matched
                link.className = 'file-link'
                const path = /https?:\/\//.test(matched)
                    ? new URL(matched).pathname.slice(1)
                    : matched
                link.onclick = () => {
                    fetch('/__open-in-editor?file=' + encodeURIComponent(path))
                }
                el.appendChild(link)
            }
        }
    }
}

function getAllMatches(text: string, regex: RegExp) {
    let curIndex = 0
    let match
    const matches: { frag; matched }[] = []
    while ((match = regex.exec(text))) {
        console.log(match)
        const { 0: matched, index } = match
        if (index != null) {
            const frag = text.slice(curIndex, index)
            matches.push({ frag, matched })
            curIndex += frag.length + matched.length
        }
    }
    return matches
}

export class ErrorOverlay extends CommonOverlay {
    root: ShadowRoot

    static overlayId = 'bundless-error-overlay'

    constructor(err: OverlayErrorPayload['err']) {
        super()
        this.root = this.attachShadow({ mode: 'open' })
        this.root.innerHTML = template({
            mainColor: '--red',
            tip: `Click outside or fix the code to dismiss.<br>`,
        })

        const hasFrame = err.frame && codeframeRE.test(err.frame)
        const message = hasFrame
            ? err.message.replace(codeframeRE, '')
            : err.message
        if (err.plugin) {
            this.displayText('.plugin', `[plugin:${err.plugin}] `)
        }
        this.displayText('.message-body', message.trim())

        const [file] = (err.loc?.file || err.id || 'unknown file').split(`?`)
        if (err.loc) {
            this.displayText(
                '.file',
                `${file}:${err.loc.line}:${err.loc.column}`,
                true,
            )
        } else if (err.id) {
            this.displayText('.file', file)
        }

        if (hasFrame) {
            this.displayText('.frame', err.frame!.trim())
        }
        this.displayText(
            '.stack',
            err.stack.replace(codeframeRE, '').trim(),
            true,
        )

        this.root.querySelector('.window')!.addEventListener('click', (e) => {
            e.stopPropagation()
        })
        this.addEventListener('click', () => {
            this.close()
        })
    }
}

customElements.define(ErrorOverlay.overlayId, ErrorOverlay)

export class InfoOverlay extends CommonOverlay {
    root: ShadowRoot

    static overlayId = 'bundless-info-overlay'

    constructor(info: OverlayInfoOpenPayload['info']) {
        super()
        this.root = this.attachShadow({ mode: 'open' })
        this.root.innerHTML = template({ mainColor: '--cyan' })

        this.displayText('.message-body', info.message.trim())

        this.root.querySelector('.window')!.addEventListener('click', (e) => {
            e.stopPropagation()
        })
        // this.addEventListener('click', () => {
        //     this.close()
        // })
    }
}
customElements.define(InfoOverlay.overlayId, InfoOverlay)

// InfoOverlay.show({ message: 'Prebundling modules' })
