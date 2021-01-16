import { Plugin } from '@bundless/cli'
import { NodeResolvePlugin, RewritePlugin } from '@bundless/cli/dist/plugins'
import { osAgnosticPath } from '@bundless/cli/dist/utils'
import { PartialMessage as ESBuildMessage } from 'esbuild'
import { promises as fs } from 'fs'
import { platform } from 'os'
import path from 'path'
import { createMakeHot } from 'svelte-hmr'
import * as compiler from 'svelte/compiler'
import {
    CompileOptions,
    Warning as SvelteWarning,
} from 'svelte/types/compiler/interfaces'
import { PreprocessorGroup } from 'svelte/types/compiler/preprocess'
import { typescriptPreprocessor } from './typescript'

let makeHot = (...args) => {
    makeHot = createMakeHot({ walk: compiler.walk })
    return makeHot(...args)
}

export function SveltePlugin(options: PluginOptions = {}): Plugin {
    let {
        compilerOptions = {},
        preprocess = [],
        typescript = true,
        hmrOptions,
    } = options

    if (typescript) {
        preprocess = [typescriptPreprocessor, ...preprocess]
    }

    return {
        name: 'svelte',
        setup(build) {
            const {
                onLoad,
                onResolve,
                ctx: { isBuild, graph, config, root },
            } = build

            NodeResolvePlugin({
                extensions: ['.svelte'],
                isExtensionRequiredInImportPath: true,
            }).setup({
                onResolve,
                onLoad() {},
            })

            if (!isBuild) {
                RewritePlugin({ filter: /\.svelte(\?.*)?$/ }).setup(build)
            }

            let cssMap: Map<string, string> = new Map()

            onLoad({ filter: /\.svelte$/i }, async (args) => {
                let source = await fs.readFile(args.path, 'utf-8')

                let finalCompileOptions: CompileOptions = {
                    css: false,
                    generate: config.platform === 'node' ? 'ssr' : 'dom',
                    ...compilerOptions,
                    dev: !isBuild,
                    filename: args.path,
                    outputFilename: args.path,
                    format: 'esm',
                }

                if (preprocess.length) {
                    let processed = await compiler.preprocess(
                        source,
                        preprocess,
                        {
                            filename: args.path,
                        },
                    )

                    source = processed.code
                    if (processed.map)
                        finalCompileOptions.sourcemap = processed.map
                }

                try {
                    let compiled = compiler.compile(source, finalCompileOptions)
                    let { js, css, warnings } = compiled

                    if (!finalCompileOptions.css && css?.code) {
                        const cssPath = args.path + '.css'
                        js.code =
                            `import "./${path.basename(cssPath)}";\n` + js.code
                        if (graph) {
                            // mark css file as a derived file from svelte
                            graph.ensureEntry(osAgnosticPath(args.path, root), {
                                computedModules: new Set([
                                    osAgnosticPath(cssPath, root),
                                ]),
                            })
                        }
                        cssMap.set(args.path, css.code)
                    }

                    if (!isBuild) {
                        js.code = makeHot({
                            id: args.path,
                            compiledCode: js.code,
                            hotOptions: {
                                preserveLocalState: true,
                                injectCss: true,
                                ...hmrOptions,
                                absoluteImports: false,
                                noOverlay: true,
                            },
                            compiled: compiled,
                            originalCode: source,
                            compileOptions: finalCompileOptions,
                        })
                    } else {
                        // needed to prebundle the hmr packages
                        // TODO if a node module is injected by a plugin only in dev, traversal can't detect it and will fail, add options with prebundleModules: []
                        js.code =
                            js.code +
                            `\nimport 'svelte-hmr/runtime/hot-api-esm'\n import 'svelte-hmr/runtime/proxy-adapter-dom'`
                    }

                    return {
                        contents: js.code,
                        warnings: warnings.map(convertMessage),
                    }
                } catch (e) {
                    return { errors: [convertMessage(e)] }
                }

                function convertMessage(msg: SvelteWarning): ESBuildMessage {
                    let { message, start, end } = msg
                    let location: undefined | ESBuildMessage['location']

                    if (start && end) {
                        let lineText = source.split(/\r\n|\r|\n/g)[start.line]
                        let lineEnd =
                            start.line == end.line
                                ? end.column
                                : lineText.length

                        location = {
                            file: args.path,
                            line: start.line,
                            column: start.column,
                            length: lineEnd - start.column,
                            lineText,
                        }
                    }

                    return { text: message, location }
                }
            })

            onResolve({ filter: /\.svelte\.css/i }, async (args) => {
                return {
                    path: path.resolve(args.resolveDir, args.path),
                }
            })

            onLoad({ filter: /\.svelte\.css/i }, ({ path: filename }) => {
                filename = filename.replace('.css', '')

                let css = cssMap.get(filename)
                if (!css) return null

                return { contents: css, loader: 'css' }
            })
        },
    }
}

export interface PluginOptions {
    compilerOptions?: CompileOptions
    preprocess?: PreprocessorGroup[]
    hmrOptions?: any // TODO find types for svelte-hmr
    typescript?: boolean
}

export default SveltePlugin
