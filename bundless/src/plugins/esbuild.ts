import chalk from 'chalk'
import * as esbuild from 'esbuild'
import { Loader, Message, TransformOptions } from 'esbuild'
import path from 'path'
import { Config } from '../config'
import { OnTransformResult, PluginHooks } from '../plugins-executor'
import { generateDefineObject } from '../prebundle/esbuild'
import { generateCodeFrame } from '../utils'

export function EsbuildTransformPlugin({} = {}) {
    return {
        name: 'esbuild-transform',
        setup: ({ onTransform, onClose, ctx: { config } }: PluginHooks) => {
            onTransform({ filter: /\.(tsx?|jsx)$/ }, async (args) => {
                // do not transpile again if already transpiled
                if (args.loader === 'js') {
                    return
                }
                return transform({
                    src: args.contents,
                    filePath: args.path,
                    config,
                })
            })
        },
    }
}

const JsxPresets: Record<
    string,
    Pick<TransformOptions, 'jsxFactory' | 'jsxFragment'>
> = {
    vue: { jsxFactory: 'jsx', jsxFragment: 'Fragment' },
    preact: { jsxFactory: 'h', jsxFragment: 'Fragment' },
    react: {},
    // react: { jsxFactory: 'React.createElement',  }, // use esbuild default
}

export function resolveJsxOptions(options: Config['jsx'] = 'react') {
    if (typeof options === 'string') {
        if (!(options in JsxPresets)) {
            console.error(`unknown jsx preset: '${options}'.`)
        }
        return JsxPresets[options] || {}
    } else if (options) {
        return {
            jsxFactory: options.factory,
            jsxFragment: options.fragment,
        }
    }
}

// transform used in server plugins with a more friendly API
export const transform = async ({
    src,
    filePath,
    config,
}: {
    src: string
    filePath: string
    config?: Config
    exitOnFailure?: boolean
}): Promise<OnTransformResult> => {
    const options: TransformOptions = {
        loader: path.extname(filePath).slice(1) as Loader,
        sourcemap: true,
        // format: 'esm', // passing format reorders exports https://github.com/evanw/esbuild/issues/710
        // ensure source file name contains full query
        sourcefile: filePath,
        // TODO use define object here? this way it works the same as in build, but this way it won't work when using another transformer
        target: 'es2020',
        ...resolveJsxOptions(config?.jsx),
    }
    try {
        const result = await esbuild.transform(src, options)
        if (result.warnings.length) {
            console.error(
                `warnings while transforming ${filePath} with esbuild:`,
            )
            result.warnings.forEach((m) => printMessage(m, src))
        }

        let contents = result.code
        // if transpiling (j|t)sx file, inject the imports for the jsx helper and
        // Fragment.
        if (filePath.endsWith('x')) {
            // if (!jsxOption || jsxOption === 'vue') {
            //     code +=
            //         `\nimport { jsx } from '${vueJsxPublicPath}'` +
            //         `\nimport { Fragment } from 'vue'`
            // }
            if (config?.jsx === 'preact') {
                contents += `\nimport { h, Fragment } from 'preact'`
            }
        }

        return {
            contents,
            map: JSON.parse(result.map),
        }
    } catch (e) {
        if (e.errors) {
            e.errors.forEach((m: Message) => printMessage(m, src))
        } else {
            console.error(e)
        }
        throw new Error(
            `Error while transforming ${filePath} with esbuild: ${e}`,
        )
    }
}

function printMessage(m: Message, code: string) {
    console.error(chalk.yellow(m.text))
    if (m.location) {
        const lines = code.split(/\r?\n/g)
        const line = Number(m.location.line)
        const column = Number(m.location.column)
        const offset =
            lines
                .slice(0, line - 1)
                .map((l) => l.length)
                .reduce((total, l) => total + l + 1, 0) + column
        console.error(generateCodeFrame(code, offset, offset + 1))
    }
}
