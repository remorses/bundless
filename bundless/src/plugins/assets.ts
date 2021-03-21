import { NodeResolvePlugin } from '@esbuild-plugins/all'
import escapeStringRegexp from 'escape-string-regexp'
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import { PluginHooks } from '../plugins-executor'
import { fileToImportPath } from '../utils'
import * as esbuild from 'esbuild'
import { transform } from './esbuild'
import { defaultImportableAssets } from '../constants'

export function AssetsPlugin({
    loader: _loader,
}: {
    loader?: Record<string, esbuild.Loader>
}) {
    let loader = _loader || {}
    loader = {
        ...Object.assign(
            {},
            ...defaultImportableAssets.map((k) => ({ [k]: 'file' })),
        ),
        ...loader,
    }
    const extensions = Object.keys(loader)
    const extensionsSet = new Set(extensions)
    return {
        name: 'assets',
        setup: ({ onLoad, onResolve, ctx: { root, config } }: PluginHooks) => {
            const filter = new RegExp(
                '(' +
                    extensions
                        .filter((x) => x !== '.css') // css is handled in css plugin
                        .map(escapeStringRegexp)
                        .join('|') +
                    ')$',
            )
            // what if an image is in another module and this resolver bypasses the node resolve plugin that runs the prebundle? maybe i need to throw? no because assets do not need to be optimized, i just need to make sure that node resolve is called before all other resolvers
            NodeResolvePlugin({
                name: 'assets-node-resolve',
                isExtensionRequiredInImportPath: true,
                extensions,
            }).setup({
                onLoad() {},
                onResolve,
            })
            onLoad({ filter }, async (args) => {
                const extension = path.extname(args.path)
                if (!extensionsSet.has(extension)) {
                    return
                }
                const publicPath = fileToImportPath(root, args.path)
                const loadedType = loader[extension]
                if (loadedType === 'file') {
                    return {
                        contents: `export default ${JSON.stringify(
                            publicPath,
                        )}`,
                    }
                }
                let data = await await fs.readFile(args.path)
                if (loadedType === 'js') {
                    return { contents: data.toString(), loader: 'js' }
                }
                if (
                    loadedType === 'jsx' ||
                    loadedType === 'ts' ||
                    loadedType === 'tsx'
                ) {
                    const res = await transform({
                        filePath: args.path,
                        src: data.toString(),
                        loader: loadedType,
                        config,
                    })
                    return {
                        contents: res.contents || '',
                        loader: 'js',
                    }
                }
                if (loadedType === 'base64') {
                    return {
                        contents: `export default "${data.toString('base64')}`,
                        loader: 'js',
                    }
                }
                if (loadedType === 'dataurl') {
                    const mimeType = mime.lookup(args.path)
                    return {
                        contents: `export default "data:${mimeType};base64,${data.toString(
                            'base64',
                        )}"`,
                        loader: 'js',
                    }
                }
                if (loadedType === 'text') {
                    return {
                        contents: `export default ${JSON.stringify(
                            data.toString(),
                        )}`,
                        loader: 'js',
                    }
                }
                if (loadedType === 'json') {
                    const transformed = await esbuild.transform(
                        data.toString(),
                        {
                            format: 'esm',
                            loader: 'json',
                            sourcefile: args.path,
                        },
                    )
                    return {
                        contents: transformed.code,
                        loader: 'js',
                    }
                }
                if (loadedType === 'binary') {
                    return {
                        contents: data.toString(), // how can i serve binary data to browser?
                        loader: 'js',
                    }
                }

                return null
            })
        },
    }
}
