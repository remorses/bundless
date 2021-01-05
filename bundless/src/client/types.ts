export type HMRPayload =
    | ConnectedPayload
    | UpdatePayload
    | FullReloadPayload
    | OverlayErrorPayload
    | OverlayInfoOpenPayload
    | OverlayInfoClosePayload
    | HotAcceptPayload
    | ConnectPayload

interface ConnectedPayload {
    type: 'connected'
}

export interface UpdatePayload {
    type: 'update'
    path: string
    updateID: number
    namespace: string
    // changeSrcPath: string
    // timestamp: number
}

interface FullReloadPayload {
    type: 'reload'
}

interface HotAcceptPayload {
    type: 'hotAccept'
    path: string
}

interface ConnectPayload {
    type: 'connected'
}
interface PingPayload {
    type: 'ping'
}

export interface OverlayErrorPayload {
    type: 'overlay-error'
    err: {
        // [name: string]: any
        message: string
        stack: string
        id?: string
        frame?: string
        plugin?: string
        pluginCode?: string
        loc?: {
            file?: string
            line: number
            column: number
        }
    }
}

export interface OverlayInfoOpenPayload {
    type: 'overlay-info-open'
    info: {
        [name: string]: any
        message: string
        showSpinner?: boolean
    }
}

export interface OverlayInfoClosePayload {
    type: 'overlay-info-close'
}
