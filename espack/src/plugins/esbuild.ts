import path from 'path'
import chalk from 'chalk'
import {
    startService,
    Service,
    TransformOptions,
    Message,
    Loader,
} from 'esbuild'
import { Config } from '../config'
import { cleanUrl, generateCodeFrame } from '../utils'
import { OnTransformResult, PluginHooks } from '../plugin'

const debug = require('debug')('esbuild')

export const tjsxRE = /\.(tsx?|jsx)$/

export function esbuildPlugin({} = {}) {
    return {
        name: 'esbuild',
        setup: ({ onTransform, config }: PluginHooks) => {
            onTransform({ filter: tjsxRE }, async (args) => {
                return transform({
                    src: args.contents,
                    filePath: args.path,
                    jsxOption: config.jsx,
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
    react: {}, // use esbuild default
}

export function resolveJsxOptions(options: Config['jsx'] = 'vue') {
    if (typeof options === 'string') {
        if (!(options in JsxPresets)) {
            console.error(`[vite] unknown jsx preset: '${options}'.`)
        }
        return JsxPresets[options] || {}
    } else if (options) {
        return {
            jsxFactory: options.factory,
            jsxFragment: options.fragment,
        }
    }
}

// lazy start the service
let _servicePromise: Promise<Service> | undefined

const ensureService = async () => {
    if (!_servicePromise) {
        _servicePromise = startService()
    }
    return _servicePromise
}

export const stopService = async () => {
    if (_servicePromise) {
        const service = await _servicePromise
        service.stop()
        _servicePromise = undefined
    }
}

// transform used in server plugins with a more friendly API
export const transform = async ({
    src,
    filePath,
    jsxOption,
}: {
    src: string
    filePath: string
    jsxOption?: Config['jsx']
    exitOnFailure?: boolean
}): Promise<OnTransformResult> => {
    const service = await ensureService()

    const options = {
        loader: path.extname(filePath).slice(1) as Loader,
        sourcemap: true,
        // ensure source file name contains full query
        sourcefile: filePath,
        target: 'es2020',
        ...resolveJsxOptions(jsxOption),
    }
    try {
        const result = await service.transform(src, options)
        if (result.warnings.length) {
            console.error(
                `[vite] warnings while transforming ${filePath} with esbuild:`,
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
            if (jsxOption === 'preact') {
                contents += `\nimport { h, Fragment } from 'preact'`
            }
        }

        return {
            contents,
            map: result.map,
        }
    } catch (e) {
        console.error(
            chalk.red(
                `[vite] error while transforming ${filePath} with esbuild:`,
            ),
        )
        if (e.errors) {
            e.errors.forEach((m: Message) => printMessage(m, src))
        } else {
            console.error(e)
        }
        debug(`options used: `, options)
        // if (exitOnFailure) {
        //     process.exit(1)
        // }
        return {
            contents: '',
            map: undefined,
        }
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
