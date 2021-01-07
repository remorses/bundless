import fs from 'fs'
import { PluginHooks } from '../plugins-executor'

export const clientFilePath = require.resolve('../../esm/client/template.js')

export const hmrClientNamespace = 'hmr-client'

export function HmrClientPlugin({ getPort }) {
    return {
        name: 'hmr-client',
        setup: ({ onLoad, ctx: { config } }: PluginHooks) => {
            onLoad(
                { filter: /.*/, namespace: hmrClientNamespace },
                async (args) => {
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
                    const hmrConfig = config.server?.hmr || true
                    if (hmrConfig && typeof hmrConfig === 'object') {
                        // hmr option has highest priory
                        socketProtocol = hmrConfig.protocol || null
                        socketHostname = hmrConfig.hostname || null
                        socketPort = hmrConfig.port || getPort()
                        if (hmrConfig.timeout) {
                            socketTimeout = hmrConfig.timeout
                        }
                        if (hmrConfig.path) {
                            socketPort = `${socketPort}/${hmrConfig.path}`
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
                                `__HMR_ENABLE_OVERLAY__`,
                                JSON.stringify(true),
                            )
                            .replace(
                                `__HMR_TIMEOUT__`,
                                JSON.stringify(socketTimeout),
                            ),
                    }
                },
            )
        },
    }
}
