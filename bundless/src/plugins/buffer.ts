import * as esbuild from 'esbuild'
import { Plugin } from '../plugins-executor'
import { importPathToFile, readFile } from '../utils'

const BUFFER_PATH = '_bundless-node-buffer-polyfill_.js'

export function NodeBufferGlobal(enties): Plugin {
    return {
        name: 'buffer-global',
        setup({ onResolve, onLoad, onTransform }) {
            onTransform({ filter: /\.html$/ }, (args) => {
                const contents = args.contents.replace(
                    /<body.*?>/,
                    `$&\n` +
                        `<script type="module" src="/${BUFFER_PATH}"></script>\n`,
                )
                return {
                    contents,
                }
            })
            onResolve({ filter: new RegExp(BUFFER_PATH) }, (arg) => {
                return {
                    path: BUFFER_PATH,
                }
            })
            onLoad({ filter: new RegExp(BUFFER_PATH) }, async (arg) => {
                const polyfill = await readFile(
                    require.resolve(
                        `@esbuild-plugins/node-globals-polyfill/Buffer.js`,
                    ),
                )
                return {
                    contents: polyfill + `\nwindow.Buffer = Buffer;`,
                    loader: 'js',
                }
            })
        },
    }
}
