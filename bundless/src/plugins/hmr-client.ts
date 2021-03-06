import fs from 'fs-extra'
import { CLIENT_PUBLIC_PATH, hmrClientNamespace } from '../constants'
import { PluginHooks } from '../plugins-executor'
import { generateDefineObject } from '../prebundle/esbuild'

export const clientFilePath = require.resolve('../../esm/client/template.js')

export const sourceMapSupportPath =
    '__source-map-support.js?namespace=source-map-support'

export function HmrClientPlugin({ getPort }) {
    return {
        name: 'hmr-client',
        setup: ({
            onLoad,
            onTransform,
            ctx: { config, root },
        }: PluginHooks) => {
            onTransform({ filter: /\.html$/ }, (args) => {
                const contents = args.contents.replace(
                    /<body.*?>/,
                    `$&\n` +
                        `<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>\n`,
                )
                return {
                    contents,
                }
            })

            onLoad(
                { filter: /.*/, namespace: 'source-map-support' },
                async () => {
                    return {
                        contents: await fs.readFile(
                            require.resolve(
                                'source-map-support/browser-source-map-support.js',
                            ),
                        ),
                    }
                },
            )

            onLoad(
                { filter: /.*/, namespace: hmrClientNamespace },
                async (args) => {
                    const defines = generateDefineObject({ config })
                    const clientCode = fs
                        .readFileSync(clientFilePath, 'utf-8')
                        .replace(
                            `__DEFINES__`,
                            '{\n' +
                                Object.keys(defines)
                                    .sort((a, b) => a.length - b.length)
                                    .map(
                                        (k) =>
                                            `  ${JSON.stringify(k)}: ${
                                                defines[k]
                                            },`,
                                    )
                                    .join('\n') +
                                '\n}',
                        )
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
