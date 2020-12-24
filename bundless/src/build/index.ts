import * as esbuild from 'esbuild'
import fs from 'fs-extra'
import path from 'path'
import { JS_EXTENSIONS, MAIN_FIELDS } from '../constants'
import * as plugins from '../plugins'
import glob from 'tiny-glob'
import posthtml, { Node } from 'posthtml'
import {
    commonEsbuildOptions,
    metafileToBundleMap,
    resolvableExtensions,
} from '../prebundle/esbuild'
import {
    isUrl,
    osAgnosticPath,
    runFunctionOnPaths,
    stripColon,
} from '../prebundle/support'
import { cleanUrl } from '../utils'

// how to get entrypoints? to support multi entry i should let the user pass them, for the single entry i can just get public/index.html or index.html
// TODO add watch feature for build
// TODO build for SSR, sets target to node, do not polyfill node stuff
export async function build({
    root,
    entryPoints,
    minify = false,
    outdir = 'out',
    env = {},
    target = 'es2018',
    base = '/',
}) {
    await fs.ensureDir(outdir)
    const publicDir = path.resolve(root, 'public')
    const metafile = path.resolve(outdir, 'metafile.json')
    const esbuildCwd = process.cwd()
    if (fs.existsSync(publicDir)) {
        await fs.copy(publicDir, outdir)
    }
    const buildResult = await esbuild.build({
        ...commonEsbuildOptions,
        metafile,
        entryPoints, // TODO transform html with plugin executor
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
                    // console.log(p)
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

    let meta = JSON.parse(
        await (await fs.promises.readFile(metafile)).toString(),
    )
    meta = runFunctionOnPaths(meta, (p) => {
        p = stripColon(p) // namespace:/path/to/file -> /path/to/file
        return p
    })

    // TODO only inject used css by traversing the metafile graph to find used css chunks
    // const outputCssFiles = await glob('**.css', { cwd: outdir, absolute: true })

    const bundleMap = metafileToBundleMap({
        entryPoints,
        esbuildCwd,
        meta,
        root,
    })

    if (!Object.keys(bundleMap).length) {
        return
    }

    for (let entry of entryPoints) {
        if (path.extname(entry) === '.html') {
            const relativePath = osAgnosticPath(entry, root)

            if (!bundleMap[relativePath]) {
                throw new Error(
                    `Cannot find output for '${relativePath}' in ${JSON.stringify(
                        bundleMap,
                        null,
                        4,
                    )}`,
                )
            }
            let outputJs = path.resolve(root, bundleMap[relativePath]!)
            const html = await (await fs.readFile(entry)).toString()
            const transformer = posthtml([
                (tree) => {
                    // remove previous script tags
                    tree.walk((node) => {
                        if (
                            node &&
                            node.tag === 'script' &&
                            node.attrs &&
                            node.attrs['type'] === 'module' &&
                            node.attrs['src'] &&
                            !isUrl(node.attrs['src'])
                        ) {
                            node.tag = false as any
                            node.content = []
                        }
                        return node
                    })
                    // add new output files back to html
                    tree.match({ tag: 'body' }, (node) => {
                        const src = '/' + path.relative(outdir, outputJs)
                        node.content = [
                            MyNode({
                                tag: 'script',
                                attrs: { type: 'module', src },
                            }),
                            // TODO inject emitted css files back to html
                            ...(node.content || []),
                        ]
                        return node
                    })
                },
            ])
            const result = await transformer.process(html)
            const outputHtmlPath = path.resolve(
                path.dirname(outputJs),
                path.basename(entry),
            )
            await fs.writeFile(outputHtmlPath, result.html)

            // emit html to dist directory, in dirname same as the output files corresponding to html entries
        } else {
            // if entry is not html, create an html file that imports the js output bundle
        }
    }
}

function generateEnvReplacements(env: Object): { [key: string]: string } {
    return Object.keys(env).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(env[key])
        return acc
    }, {})
}

function MyNode(x: Partial<Node>): Node {
    return x as any
}
