import * as esbuild from 'esbuild'
import fsx from 'fs-extra'
import path from 'path'
import { JS_EXTENSIONS, MAIN_FIELDS } from '../constants'
import { NodeModulesPolyfillPlugin, NodeResolvePlugin } from '../plugins'

// how to get entrypoints? to support multi entry i should let the user pass them, for the single entry i can just get public/index.html or index.html
// TODO add watch feature for build
// TODO build for SSR,
export async function build({
    root,
    entryPoints,
    minify = true,
    outdir,
    env,
    target = 'es2018',
    base,
}) {
    await fsx.ensureDir(outdir)
    const publicDir = path.resolve(root, 'public')
    if (fsx.existsSync(publicDir)) {
        await fsx.copy(publicDir, outdir)
    }
    await esbuild.build({
        entryPoints,
        bundle: true,
        platform: 'browser',
        target,
        publicPath: base,
        splitting: true, // needed to dedupe modules
        // external: externalPackages,
        minifyIdentifiers: Boolean(minify),

        minifySyntax: Boolean(minify),
        minifyWhitespace: Boolean(minify),
        mainFields: MAIN_FIELDS,
        define: {
            'process.env.NODE_ENV': JSON.stringify('dev'),
            global: 'window',
            ...generateEnvReplacements(env),
        },
        inject: [
            require.resolve('@esbuild-plugins/node-globals-polyfill/process'),
        ],
        plugins: [
            NodeResolvePlugin({
                mainFields: MAIN_FIELDS,
                extensions: [...JS_EXTENSIONS],
            }),
            NodeModulesPolyfillPlugin(),
            // TODO html plugin
            // TODO css plugin to inject css files back to html (only to entries that are parent in the import graph)
        ],
        // tsconfig: tsconfigTempFile,
        format: 'esm',
        write: true,
        outdir,
        minify: Boolean(minify),
        logLevel: 'info',
    })
}

function generateEnvReplacements(env: Object): { [key: string]: string } {
    return Object.keys(env).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(env[key])
        return acc
    }, {})
}
