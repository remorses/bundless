import * as esbuild from 'esbuild'
import fsx from 'fs-extra'
import path from 'path'
import { JS_EXTENSIONS, MAIN_FIELDS } from '../constants'
import * as plugins from '../plugins'
import {
    commonEsbuildOptions,
    resolvableExtensions,
} from '../prebundle/esbuild'
import { cleanUrl } from '../utils'

// how to get entrypoints? to support multi entry i should let the user pass them, for the single entry i can just get public/index.html or index.html
// TODO add watch feature for build
// TODO build for SSR,
export async function build({
    root,
    entryPoints,
    minify = false,
    outdir = 'out',
    env = {},
    target = 'es2018',
    base = '/',
}) {
    await fsx.ensureDir(outdir)
    const publicDir = path.resolve(root, 'public')
    const metafile = path.resolve(outdir, 'metafile.json')
    if (fsx.existsSync(publicDir)) {
        await fsx.copy(publicDir, outdir)
    }
    await esbuild.build({
        ...commonEsbuildOptions,
        metafile,
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
            // require.resolve('@esbuild-plugins/node-globals-polyfill/process'),
        ],
        plugins: [
            plugins.NodeResolvePlugin({
                name: 'node-resolve',
                onNonResolved: (p) => {
                    throw new Error(`Cannot resolve '${p}'`)
                },
                onResolved: (p) => {
                    console.log(p)
                },
                mainFields: MAIN_FIELDS,
                extensions: resolvableExtensions,
            }),
            plugins.NodeModulesPolyfillPlugin(),
            plugins.HtmlIngestPlugin({
                root,
                name: 'html-ingest',
                transformImportPath: cleanUrl,
            }),
        ],
        // tsconfig: tsconfigTempFile,
        format: 'esm',
        write: true,
        outdir,
        minify: Boolean(minify),
    })

    // TODO inject emitted css files back to html
    // TODO inject emitted html.js files back to html
}

function generateEnvReplacements(env: Object): { [key: string]: string } {
    return Object.keys(env).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(env[key])
        return acc
    }, {})
}
