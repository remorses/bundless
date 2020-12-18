export type HMRPayload =
    | ConnectedPayload
    | UpdatePayload
    | FullReloadPayload
    | ErrorPayload
    | HotAcceptPayload
    | ConnectPayload

interface ConnectedPayload {
    type: 'connected'
}

export interface UpdatePayload {
    type: 'update'
    path: string
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

interface ErrorPayload {
    type: 'error'
    title?: string
    errorMessage?: string
    fileLoc?: string
}
interface ConnectPayload {
    type: 'connected'
}
interface PingPayload {
    type: 'ping'
}
