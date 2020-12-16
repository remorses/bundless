import fs from 'fs'
import { CLIENT_PUBLIC_PATH } from '../constants'
import { ServerMiddleware } from '../serve'
// import { defaultDefines } from '../config'

export const clientFilePath = require.resolve('../../esm/client/template.js')

export const clientMiddleware: ServerMiddleware = ({ app, config }) => {
    const clientCode = fs
        .readFileSync(clientFilePath, 'utf-8')
        .replace(`__MODE__`, JSON.stringify('development'))
        .replace(`__DEFINES__`, JSON.stringify({}))
        .replace(`//# sourceMappingURL=`, '//')

    app.use(async (ctx, next) => {
        if (ctx.path === CLIENT_PUBLIC_PATH) {
            let socketPort: number | string = ctx.app.context.port
            // infer on client by default
            let socketProtocol: any = null
            let socketHostname: any = null
            let socketTimeout = 30000
            if (config.hmr && typeof config.hmr === 'object') {
                // hmr option has highest priory
                socketProtocol = config.hmr.protocol || null
                socketHostname = config.hmr.hostname || null
                socketPort = config.hmr.port || ctx.app.context.port
                if (config.hmr.timeout) {
                    socketTimeout = config.hmr.timeout
                }
                if (config.hmr.path) {
                    socketPort = `${socketPort}/${config.hmr.path}`
                }
            }
            ctx.type = 'js'
            ctx.status = 200
            ctx.body = clientCode
                .replace(`__HMR_PROTOCOL__`, JSON.stringify(socketProtocol))
                .replace(`__HMR_HOSTNAME__`, JSON.stringify(socketHostname))
                .replace(`__HMR_PORT__`, JSON.stringify(socketPort))
                .replace(`__HMR_TIMEOUT__`, JSON.stringify(socketTimeout))
        } else {
            return next()
        }
    })
}
