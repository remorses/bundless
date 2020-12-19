// This file runs in the browser.
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = "development";
const defines = {};
Object.keys(defines).forEach((key) => {
    const segs = key.split('.');
    let target = window;
    for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (i === segs.length - 1) {
            target[seg] = defines[key];
        }
        else {
            target = target[seg] || (target[seg] = {});
        }
    }
});
// use server configuration, then fallback to inference
const socketProtocol = null || (location.protocol === 'https:' ? 'wss' : 'ws');
const socketHost = `${null || location.hostname}:${9000}`;
const socketURL = `${socketProtocol}://${socketHost}`;
const isWindowDefined = typeof window !== 'undefined';
function log(...args) {
    console.log('[ESM-HMR]', ...args);
}
function reload() {
    if (!isWindowDefined) {
        return;
    }
    location.reload(true);
}
/** Clear all error overlays from the page */
function clearErrorOverlay() {
    if (!isWindowDefined) {
        return;
    }
    document.querySelectorAll('hmr-error-overlay').forEach((el) => el.remove());
}
/** Create an error overlay (if custom element exists on the page). */
function createNewErrorOverlay(data) {
    return; // TODO error overlay
    if (!isWindowDefined) {
        return;
    }
    const HmrErrorOverlay = customElements.get('hmr-error-overlay');
    if (HmrErrorOverlay) {
        const overlay = new HmrErrorOverlay(data);
        clearErrorOverlay();
        document.body.appendChild(overlay);
    }
}
let SOCKET_MESSAGE_QUEUE = [];
let connected = false;
function _sendSocketMessage(msg) {
    socket.send(JSON.stringify(msg));
}
function sendSocketMessage(msg) {
    if (!connected) {
        SOCKET_MESSAGE_QUEUE.push(msg);
    }
    else {
        _sendSocketMessage(msg);
    }
}
const socket = new WebSocket(socketURL, 'esm-hmr');
const REGISTERED_MODULES = {};
class HotModuleState {
    constructor(path) {
        this.data = {};
        this.isLocked = false;
        this.isDeclined = false;
        this.isAccepted = false;
        this.acceptCallbacks = [];
        this.disposeCallbacks = [];
        this.path = '';
        this.path = path;
    }
    lock() {
        this.isLocked = true;
    }
    dispose(callback) {
        this.disposeCallbacks.push(callback);
    }
    invalidate() {
        reload();
    }
    decline() {
        this.isDeclined = true;
    }
    accept(_deps, callback = true) {
        if (this.isLocked) {
            return;
        }
        if (!this.isAccepted) {
            sendSocketMessage({ path: this.path, type: 'hotAccept' });
            this.isAccepted = true;
        }
        if (!Array.isArray(_deps)) {
            callback = _deps || callback;
            _deps = [];
        }
        if (callback === true) {
            callback = () => { };
        }
        const deps = _deps.map((dep) => {
            const ext = dep.split('.').pop();
            if (!ext) {
                dep += '.js';
            }
            else if (ext !== 'js') {
                dep += '.proxy.js';
            }
            return new URL(dep, `${window.location.origin}${this.path}`)
                .pathname;
        });
        this.acceptCallbacks.push({
            deps,
            callback,
        });
    }
}
export function createHotContext(fullUrl) {
    const id = new URL(fullUrl).pathname;
    const existing = REGISTERED_MODULES[id];
    if (existing) {
        existing.lock();
        runModuleDispose(id);
        return existing;
    }
    const state = new HotModuleState(id);
    REGISTERED_MODULES[id] = state;
    return state;
}
/** Called when any CSS file is loaded. */
// async function runCssStyleAccept({ url: id }) {
//     const nonce = Date.now()
//     const oldLinkEl =
//         document.head.querySelector(`link[data-hmr="${id}"]`) ||
//         document.head.querySelector(`link[href="${id}"]`)
//     if (!oldLinkEl) {
//         return true
//     }
//     const linkEl = oldLinkEl.cloneNode(false)
//     linkEl.dataset.hmr = id
//     linkEl.type = 'text/css'
//     linkEl.rel = 'stylesheet'
//     linkEl.href = id + '?t=' + nonce
//     linkEl.addEventListener(
//         'load',
//         // Once loaded, remove the old link element (with some delay, to avoid FOUC)
//         () => setTimeout(() => document.head.removeChild(oldLinkEl), 30),
//         false,
//     )
//     oldLinkEl.parentNode.insertBefore(linkEl, oldLinkEl)
//     return true
// }
/** Called when a new module is loaded, to pass the updated module to the "active" module */
async function runJsModuleAccept({ path }) {
    const state = REGISTERED_MODULES[path];
    if (!state) {
        return false;
    }
    if (state.isDeclined) {
        return false;
    }
    const acceptCallbacks = state.acceptCallbacks;
    const updateID = Date.now();
    for (const { deps, callback: acceptCallback } of acceptCallbacks) {
        const [module, ...depModules] = await Promise.all([
            import(path + `?t=${updateID}`),
            ...deps.map((d) => import(d + `?t=${updateID}`)),
        ]);
        acceptCallback({ module, deps: depModules });
    }
    return true;
}
/** Called when a new module is loaded, to run cleanup on the old module (if needed) */
async function runModuleDispose(id) {
    const state = REGISTERED_MODULES[id];
    if (!state) {
        return false;
    }
    if (state.isDeclined) {
        return false;
    }
    const disposeCallbacks = state.disposeCallbacks;
    state.disposeCallbacks = [];
    state.data = {};
    disposeCallbacks.map((callback) => callback());
    return true;
}
socket.addEventListener('message', ({ data: _data }) => {
    if (!_data) {
        return;
    }
    const data = JSON.parse(_data);
    if (data.type === 'connected') {
        connected = true;
        SOCKET_MESSAGE_QUEUE.forEach(_sendSocketMessage);
        SOCKET_MESSAGE_QUEUE = [];
        setInterval(() => socket.send(JSON.stringify({ type: 'ping' })), 30000);
        return;
    }
    if (data.type === 'reload') {
        log('message: reload');
        reload();
        return;
    }
    if (data.type === 'error') {
        console.error(`[ESM-HMR] ${data.fileLoc ? data.fileLoc + '\n' : ''}`, data.title + '\n' + data.errorMessage);
        createNewErrorOverlay(data);
        return;
    }
    if (data.type === 'update') {
        log('message: update', data);
        runJsModuleAccept(data)
            .then((ok) => {
            if (ok) {
                clearErrorOverlay();
            }
            else {
                reload();
            }
        })
            .catch((err) => {
            console.error('[ESM-HMR] Hot Update Error', err);
            // A failed import gives a TypeError, but invalid ESM imports/exports give a SyntaxError.
            // Failed build results already get reported via a better WebSocket update.
            // We only want to report invalid code like a bad import that doesn't exist.
            if (err instanceof SyntaxError) {
                createNewErrorOverlay({
                    title: 'Hot Update Error',
                    fileLoc: data.path,
                    errorMessage: err.message,
                    errorStackTrace: err.stack,
                });
            }
        });
        return;
    }
    log('message: unknown', data);
});
log('listening for file changes...');
/** Runtime error reporting: If a runtime error occurs, show it in an overlay. */
// isWindowDefined &&
//     window.addEventListener('error', function(event) {
//         // Generate an "error location" string
//         let fileLoc
//         if (event.filename) {
//             fileLoc = event.filename
//             if (event.lineno !== undefined) {
//                 fileLoc += ` [:${event.lineno}`
//                 if (event.colno !== undefined) {
//                     fileLoc += `:${event.colno}`
//                 }
//                 fileLoc += `]`
//             }
//         }
//         createNewErrorOverlay({
//             title: 'Unhandled Runtime Error',
//             fileLoc,
//             errorMessage: event.message,
//             errorStackTrace: event.error ? event.error.stack : undefined,
//         })
//     })
//template.js.map