import fs from 'fs'
import { escapeRegExp } from 'lodash'
import { CLIENT_PUBLIC_PATH } from '../constants'
import { PluginHooks } from '../plugin'
import { ServerMiddleware } from '../serve'

export const clientFilePath = require.resolve('../../esm/client/template.js')

export function HmrClientPlugin({ getPort }) {
    return {
        name: 'hmr-client',
        setup: ({ onLoad, config }: PluginHooks) => {
            onLoad({ filter: new RegExp(CLIENT_PUBLIC_PATH + '$') }, async (args) => {
                const clientCode = fs
                    .readFileSync(clientFilePath, 'utf-8')
                    .replace(`__MODE__`, JSON.stringify('development'))
                    .replace(`__DEFINES__`, JSON.stringify({}))
                    .replace(`//# sourceMappingURL=`, '//')

                let socketPort: number | string = getPort()
                // infer on client by default
                let socketProtocol: any = null
                let socketHostname: any = null
                let socketTimeout = 30000
                if (config.hmr && typeof config.hmr === 'object') {
                    // hmr option has highest priory
                    socketProtocol = config.hmr.protocol || null
                    socketHostname = config.hmr.hostname || null
                    socketPort = config.hmr.port || getPort()
                    if (config.hmr.timeout) {
                        socketTimeout = config.hmr.timeout
                    }
                    if (config.hmr.path) {
                        socketPort = `${socketPort}/${config.hmr.path}`
                    }
                }
                return {
                    contents: clientCode
                        .replace(
                            `__HMR_PROTOCOL__`,
                            JSON.stringify(socketProtocol),
                        )
                        .replace(
                            `__HMR_HOSTNAME__`,
                            JSON.stringify(socketHostname),
                        )
                        .replace(`__HMR_PORT__`, JSON.stringify(socketPort))
                        .replace(
                            `__HMR_TIMEOUT__`,
                            JSON.stringify(socketTimeout),
                        ),
                }
            })
        },
    }
}
