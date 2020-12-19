import chalk from 'chalk'
import {
    Loader,
    Message,
    Service,
    startService,
    TransformOptions,
} from 'esbuild'
import path from 'path'
import { Config } from '../config'
import { OnTransformResult, PluginHooks } from '../plugin'
import { generateCodeFrame } from '../utils'

export function EsbuildTransformPlugin({} = {}) {
    return {
        name: 'esbuild',
        setup: ({ onTransform, onClose, config }: PluginHooks) => {
            onTransform({ filter: /\.(tsx?|jsx)$/ }, async (args) => {
                return transform({
                    src: args.contents,
                    filePath: args.path,
                    jsxOption: config.jsx,
                })
            })
            onClose({}, () => {
                return stopService()
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
        target: 'es2018',
        ...resolveJsxOptions(jsxOption),
    }
    try {
        const result = await service.transform(src, options)
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
            if (jsxOption === 'preact') {
                contents += `\nimport { h, Fragment } from 'preact'`
            }
        }

        return {
            contents,
            map: result.map,
        }
    } catch (e) {
        if (e.errors) {
            e.errors.forEach((m: Message) => printMessage(m, src))
        } else {
            console.error(e)
        }
        throw new Error(`Error while transforming ${filePath} with esbuild: ${e}`)
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
