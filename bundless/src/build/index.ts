import * as esbuild from 'esbuild'
import beautify from 'posthtml-beautify'

import fromEntries from 'fromentries'
import fs from 'fs-extra'
import path from 'path'
import posthtml, { Node } from 'posthtml'
import { BuildConfig } from '../config'
import { MAIN_FIELDS } from '../constants'
import * as plugins from '../plugins'
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
import { metaToTraversalResult } from '../prebundle/traverse'
import { cleanUrl } from '../utils'

// how to get entrypoints? to support multi entry i should let the user pass them, for the single entry i can just get public/index.html or index.html
// TODO add watch feature for build
// TODO build for SSR, sets target to node, do not polyfill node stuff
export async function build({
    root,
    entryPoints,
    minify = false,
    outDir = 'out',
    env = {},
    jsTarget = 'es2018',
    basePath = '/',
}: BuildConfig & { root: string; entryPoints: string[] }) {
    entryPoints = entryPoints.map((x) => path.resolve(root, x))
    await fs.remove(outDir)
    await fs.ensureDir(outDir)
    const publicDir = path.resolve(root, 'public')
    const metafile = path.resolve(outDir, 'metafile.json')
    const esbuildCwd = process.cwd()
    if (fs.existsSync(publicDir)) {
        await fs.copy(publicDir, outDir)
    }
    const buildResult = await esbuild.build({
        ...commonEsbuildOptions,
        metafile,
        entryPoints, // TODO transform html with plugin executor
        bundle: true,
        platform: 'browser',
        target: jsTarget,
        publicPath: basePath,
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
        outdir: outDir,
        minify: Boolean(minify),
    })

    let meta: esbuild.Metadata = JSON.parse(
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

    const traversalGraph = await metaToTraversalResult({
        meta,
        entryPoints,
        root,
        esbuildCwd,
    })

    const cssToInject: Record<string, string[]> = fromEntries(
        entryPoints.map((x) => osAgnosticPath(x, root)).map((k) => [k, []]),
    )

    // find all the css files, for every entry file traverse its imports and collect all css files, add the css outputs to cssToInject
    for (let entry of entryPoints.map((x) => osAgnosticPath(x, root))) {
        traverseGraphDown({
            entryPoints: [entry],
            traversalGraph,
            onNode(imported) {
                if (cleanUrl(imported).endsWith('.css')) {
                    const abs = path.resolve(root, imported)
                    let output = Object.keys(meta.outputs).find((x) => {
                        if (!x.endsWith('.css')) {
                            return
                        }
                        const info = meta.outputs[x]
                        const absInputs = new Set(
                            Object.keys(info.inputs).map((x) =>
                                path.resolve(esbuildCwd, x),
                            ),
                        )
                        if (absInputs.has(abs)) {
                            return true
                        }
                    })
                    if (!output) {
                        throw new Error(`Cannot find output for '${imported}'`)
                    }
                    output = path.resolve(esbuildCwd, output)
                    cssToInject[entry].push(output)
                }
            },
        })
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
            const transformer = posthtml(
                [
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
                            const jsSrc = '/' + path.relative(outDir, outputJs)
                            node.content = [
                                MyNode({
                                    tag: 'script',
                                    attrs: { type: 'module', src: jsSrc },
                                }),

                                ...(node.content || []),
                            ]
                            return node
                        })

                        // insert head if missing
                        if (!findHtmlTag(tree, 'head')) {
                            const html = findHtmlTag(tree, 'html')
                            if (html) {
                                tree.match({ tag: 'html' }, (html) => {
                                    html.content = insertFirst(
                                        html.content,
                                        MyNode({ tag: 'head', content: [] }),
                                    )
                                    return html
                                })
                            } else {
                                if (Array.isArray(tree)) {
                                    tree = Object.assign(
                                        tree,
                                        insertFirst(
                                            tree,
                                            MyNode({
                                                tag: 'head',
                                                content: [],
                                            }),
                                        ),
                                    )
                                }
                            }
                        }

                        tree.match({ tag: 'head' }, (node) => {
                            const cssHrefs =
                                cssToInject[osAgnosticPath(entry, root)] || []
                            node.content = [
                                // TODO maybe include imported fonts as links?
                                ...cssHrefs.map((href) => {
                                    href = '/' + path.relative(outDir, href)
                                    return MyNode({
                                        tag: 'link',
                                        attrs: { href },
                                    })
                                }),
                                // TODO inject emitted css files back to html
                                ...(node.content || []),
                            ]
                            return node
                        })
                    },
                    !minify && beautify({ rules: { indent: 4 } }),
                ].filter(Boolean),
            )
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

function findHtmlTag(tree: Node, tag: string): Node | undefined {
    let found
    tree.match({ tag }, (node) => {
        found = node
        return node
    })
    return found
}

function insertFirst(items, node) {
    return [
        ...items.filter((x) => typeof x === 'string'),
        node,
        ...items.filter((x) => typeof x !== 'string'),
    ]
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

function traverseGraphDown(args: {
    traversalGraph: Record<string, string[]>
    entryPoints: string[]
    onNode
}) {
    const { entryPoints, traversalGraph, onNode } = args
    const toVisit: string[] = entryPoints
    const visited = new Set<string>()
    while (toVisit.length) {
        const entry = toVisit.shift()
        if (!entry || visited.has(entry)) {
            break
        }
        visited.add(entry)
        const imports = traversalGraph[entry]
        if (!imports) {
            throw new Error(
                `Node for '${entry}' not found in graph: ${JSON.stringify(
                    JSON.stringify(Object.keys(traversalGraph), null, 4),
                )}`,
            )
        }
        if (onNode) {
            onNode(entry)
        }
        toVisit.push(...imports)
    }
}
