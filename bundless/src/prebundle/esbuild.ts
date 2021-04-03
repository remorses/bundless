import * as esbuild from 'esbuild'
import { Metafile } from 'esbuild'
import fromEntries from 'fromentries'
import fs from 'fs-extra'
import path from 'path'
import slash from 'slash'
import tmpfile from 'tmpfile'
import { Config, Platform } from '../config'
import { osAgnosticPath } from '../utils'
import * as plugins from '../plugins'
import {
    defaultImportableAssets as defaultImportableAssets,
    defaultLoader,
    isRunningWithYarnPnp,
    JS_EXTENSIONS,
    MAIN_FIELDS,
} from '../constants'
import { logger } from '../logger'
import { DependencyStatsOutput } from './stats'
import {
    OptimizeAnalysisResult,
    runFunctionOnPaths,
    stripColon,
} from './support'
import { PluginsExecutor } from '../plugins-executor'

export const commonEsbuildOptions = (
    config: Config = {},
): esbuild.BuildOptions => {
    const omitHashes = process.env.BUNDLESS_CONSISTENT_HMR_GRAPH_HASH != null
    return {
        target: 'es2020',
        entryNames: !omitHashes ? '[dir]/[name]-[hash]' : '[dir]/[name]',
        chunkNames: 'chunks/[name]-[hash]',
        minify: false,
        minifyIdentifiers: false,
        minifySyntax: false,
        metafile: true,
        minifyWhitespace: false,
        mainFields: MAIN_FIELDS,
        sourcemap: false,
        bundle: true,
        platform: 'browser',
        format: 'esm',
        write: true,
        logLevel: 'error',
        loader: {
            '.js': 'jsx',
            '.cjs': 'js',
            // '.svg': 'dataurl', // TODO enable svg as data uri in development and in build
            ...defaultLoader,
            ...config.loader,
        },
        define: generateDefineObject({ config }),
    }
}

export function generateDefineObject({
    config = {} as Config,
    platform = 'browser' as Platform,
    isProd = false,
}) {
    if (platform === 'node') {
        return {
            'process.browser': 'false',
            ...config.define, // TODO mock browser stuff like fetch? this allows me to target other platform like cloudflare workers ...
        }
    }
    const noop = 'String'
    const nodeEnv =
        process.env.NODE_ENV || (isProd ? 'production' : 'development')
    return {
        'process.env.NODE_ENV': JSON.stringify(nodeEnv),
        // ...generateEnvReplacements(config.env || {}),
        'process.pid': '0',
        // global: 'window',
        __filename: '""',
        __dirname: '""',
        // TODO remove defines and use inject instead
        // TODO use the process inject instead of define
        // process: '{}',
        global: 'window',
        // 'process.env': '{}',
        'process.browser': 'true',
        'process.version': '""',
        // 'process.argv': '[]',
        // module: '{}',
        // Buffer: noop,
        // 'process.cwd': noop,
        // 'process.chdir': noop,
        clearImmediate: noop,
        setImmediate: noop,
        ...config.define,
    }
}

export const defaultResolvableExtensions = [
    ...JS_EXTENSIONS,
    ...defaultImportableAssets,
    '.json',
    '.css',
]

export async function bundleWithEsBuild({
    entryPoints,
    root,
    dest: destLoc,
    config,
    ...options
}) {
    const { alias = {}, externalPackages = [], minify = false } = options

    const tsconfigTempFile = tmpfile('.json')
    await fs.promises.writeFile(tsconfigTempFile, makeTsConfig({ alias }))

    // rimraf.sync(destLoc) // do not delete or on flight imports will return 404

    const initialOptions: esbuild.BuildOptions = {
        entryPoints,
        ...commonEsbuildOptions(config),
        splitting: true, // needed to dedupe modules
        external: externalPackages,
        minify: Boolean(minify),
        minifyIdentifiers: Boolean(minify),
        minifySyntax: Boolean(minify),
        minifyWhitespace: Boolean(minify),
        mainFields: MAIN_FIELDS,
        tsconfig: tsconfigTempFile,
        sourcemap: 'inline',
        bundle: true,
        write: true,
        outdir: destLoc,
        metafile: true,
    }

    const executor = new PluginsExecutor({
        initialOptions,
        ctx: {
            config: { root },
            isBuild: true,
            root,
        },
        plugins: [
            ...(config.plugins || []),
            plugins.NodeGlobalsPolyfillPlugin({
                buffer: true,
                process: true,
                define: initialOptions.define,
            }),
            plugins.NodeModulesPolyfillPlugin({
                namespace: 'node-modules-polyfills',
            }),
            plugins.CssPlugin(),
            plugins.NodeResolvePlugin({
                name: 'prebundle-node-resolve',
                mainFields: MAIN_FIELDS,
                extensions: [
                    ...defaultResolvableExtensions,
                    ...(Object.keys(config.loader || {}) || []),
                ],
                onNonResolved: (p, importer, e) => {
                    logger.debug(e.message + '\n' + e.stack)
                    logger.warn(
                        `Cannot resolve '${p}' from '${importer}' during traversal, using yarn pnp: ${isRunningWithYarnPnp}`,
                    )
                },
            }),
            plugins.UrlResolverPlugin(),
        ],
    })

    const buildResult = await esbuild.build({
        ...initialOptions,
        plugins: executor.esbuildPlugins(),
    })

    await fs.promises.unlink(tsconfigTempFile)

    let meta = buildResult.metafile!
    meta = runFunctionOnPaths(meta, (p) => {
        p = stripColon(p) // namespace:/path/to/file -> /path/to/file
        return p
    })
    const esbuildCwd = process.cwd()
    const bundleMap = metafileToBundleMap({
        meta,
        esbuildCwd,
        root,
    })

    const analysis = metafileToAnalysis({ meta, root, esbuildCwd })

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

/**
 * Returns aon object that maps from entry (relative path from root) to output (relative path from root too)
 */
export function metafileToBundleMap(_options: {
    root: string
    esbuildCwd: string
    meta: Metafile
}): BundleMap {
    const { meta, root, esbuildCwd } = _options

    const maps: Array<[string, string]> = Object.keys(meta.outputs)
        .map((output): [string, string] | undefined => {
            // chunks cannot be entrypoints
            const entry = meta.outputs[output].entryPoint
            if (!entry) {
                return
            }
            return [
                osAgnosticPath(path.resolve(esbuildCwd, entry), root),
                osAgnosticPath(path.resolve(esbuildCwd, output), root),
            ]
        })
        .filter(Boolean) as any

    const bundleMap = fromEntries(maps)

    return bundleMap
}

function metafileToAnalysis(_options: {
    meta: Metafile
    root: string
    esbuildCwd: string
}): OptimizeAnalysisResult {
    const { meta, root, esbuildCwd } = _options
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
                        info.exports?.length === 1 &&
                        info.exports?.[0] === 'default'
                    if (!isCommonjs) {
                        return
                    }
                    // what if imported path ahs not yet been converted by prebundler? then prebundler should lock server, it's impossible
                    return [
                        osAgnosticPath(path.resolve(esbuildCwd, output), root),
                        isCommonjs,
                    ]
                })
                .filter(Boolean) as any,
        ),
    }
    return analysis
}

export function metafileToStats(_options: {
    meta: Metafile
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
        const relativePath = slash(path.relative(destLoc, value.path))
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
