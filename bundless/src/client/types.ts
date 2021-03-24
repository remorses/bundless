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
    updateID: string
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
