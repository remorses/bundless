import {
    NodeModulesPolyfillPlugin,
    NodeResolvePlugin,
} from '@esbuild-plugins/all'
import type { Metadata } from 'esbuild'
import fromEntries from 'fromentries'
import fs from 'fs'
import path from 'path'
import toUnixPath from 'slash'
import tmpfile from 'tmpfile'
import { removeColonsFromMeta } from './support'
import { DependencyStatsOutput } from './stats'
import { OptimizeAnalysisResult, osAgnosticPath, stripColon } from './support'

const esbuild: typeof import('esbuild').build = process.env.USE_MY_LOCAL_ESBUILD
    ? require('my-esbuild').build
    : require('esbuild').build

export async function bundleWithEsBuild({
    entryPoints,
    dest: destLoc,
    ...options
}) {
    const {
        env = {},
        alias = {},
        externalPackages = [],
        minify = false,
    } = options

    const metafile = path.join(destLoc, './meta.json')
    // const entryPoints = [...Object.values(installEntrypoints)]

    const tsconfigTempFile = tmpfile('.json')
    await fs.promises.writeFile(tsconfigTempFile, makeTsConfig({ alias }))

    // rimraf.sync(destLoc) // do not delete or on flight imports will return 404
    await esbuild({
        splitting: true, // needed to dedupe modules
        external: externalPackages,
        minifyIdentifiers: Boolean(minify),
        minifySyntax: Boolean(minify),
        minifyWhitespace: Boolean(minify),
        mainFields: ['browser:module', 'module', 'browser', 'main'].filter(
            Boolean,
        ),
        // sourcemap: 'inline', // TODO sourcemaps panics and gives a lot of CPU load
        define: {
            'process.env.NODE_ENV': JSON.stringify('dev'),
            global: 'window',
            ...generateEnvReplacements(env),
        },
        inject: [
            require.resolve('@esbuild-plugins/node-globals-polyfill/process'),
        ],
        plugins: [NodeResolvePlugin({}), NodeModulesPolyfillPlugin()],
        tsconfig: tsconfigTempFile,
        bundle: true,
        format: 'esm',
        write: true,
        entryPoints,
        outdir: destLoc,
        minify: Boolean(minify),
        logLevel: 'info',
        metafile,
    })

    await fs.promises.unlink(tsconfigTempFile)

    let meta = JSON.parse(
        await (await fs.promises.readFile(metafile)).toString(),
    )

    meta = removeColonsFromMeta(meta, )

    const bundleMap = metafileToBundleMap({
        entryPoints,
        meta,
    })
    const analysis = metafileToAnalysis({ meta, entryPoints })

    const stats = metafileToStats({ meta, destLoc })

    return { stats, bundleMap, analysis }
}

function makeTsConfig({ alias }) {
    const aliases = Object.keys(alias || {}).map((k) => {
        return {
            [k]: [alias[k]],
        }
    })
    const tsconfig = {
        compilerOptions: { baseUrl: '.', paths: Object.assign({}, ...aliases) },
    }

    return JSON.stringify(tsconfig)
}

export type BundleMap = Partial<Record<string, string>>

function metafileToBundleMap(_options: {
    entryPoints: string[]
    meta: Metadata
}): BundleMap {
    const { entryPoints, meta } = _options
    const inputFiles = new Set(entryPoints.map((x) => path.resolve(x)))

    const maps: Array<[string, string]> = Object.keys(meta.outputs)
        .map((output): [string, string] | undefined => {
            // chunks cannot be entrypoints
            if (path.basename(output).startsWith('chunk.')) {
                return
            }
            const inputs = Object.keys(meta.outputs[output].inputs)
            const input = inputs.find((x) => inputFiles.has(path.resolve(x)))
            if (!input) {
                return
            }
            // const specifier = inputFilesToSpecifiers[input]
            return [osAgnosticPath(input), osAgnosticPath(output)]
        })
        .filter(Boolean) as any

    const bundleMap = fromEntries(
        maps,
    )

    return bundleMap
}

function metafileToAnalysis(_options: {
    meta: Metadata
    entryPoints: string[]
}): OptimizeAnalysisResult {
    const { meta, entryPoints } = _options
    const analysis: OptimizeAnalysisResult = {
        isCommonjs: fromEntries(
            Object.keys(meta.outputs)
                .map((output): [string, true] | undefined => {
                    if (path.basename(output).startsWith('chunk.')) {
                        return 
                    }
                    const info = meta.outputs[output]
                    if (!info) {
                        throw new Error(`cannot find output info for ${output}`)
                    }
                    const isCommonjs =
                        info.exports.length === 1 &&
                        info.exports[0] === 'default'
                    if (!isCommonjs) {
                        return
                    }
                    // what if imported path ahs not yet been converted by prebundler? then prebundler should lock server, it's impossible
                    return [osAgnosticPath(output), isCommonjs]
                })
                .filter(Boolean) as any,
        ),
    }
    return analysis
}

function metafileToStats(_options: {
    meta: Metadata
    destLoc: string
}): DependencyStatsOutput {
    const { meta, destLoc } = _options
    const stats = Object.keys(meta.outputs).map((output) => {
        const value = meta.outputs[output]
        // const inputs = meta.outputs[output].bytes;
        return {
            path: output,
            isCommon: ['chunk.'].some((x) =>
                path.basename(output).startsWith(x),
            ),
            bytes: value.bytes,
        }
    })

    function makeStatObject(value) {
        const relativePath = toUnixPath(path.relative(destLoc, value.path))
        return {
            [relativePath]: {
                size: value.bytes,
                // gzip: zlib.gzipSync(contents).byteLength,
                // brotli: zlib.brotliCompressSync ? zlib.brotliCompressSync(contents).byteLength : 0,
            },
        }
    }

    return {
        common: Object.assign(
            {},
            ...stats.filter((x) => x.isCommon).map(makeStatObject),
        ),
        direct: Object.assign(
            {},
            ...stats.filter((x) => !x.isCommon).map(makeStatObject),
        ),
    }
}

function generateEnvReplacements(env: Object): { [key: string]: string } {
    return Object.keys(env).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(env[key])
        return acc
    }, {})
}
