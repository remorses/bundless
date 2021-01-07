import { Metadata } from 'esbuild'
import { forOwn, isPlainObject } from 'lodash'

export function isUrl(req: string) {
    return (
        req.startsWith('http://') ||
        req.startsWith('https://') ||
        req.startsWith('//')
    )
}
export interface OptimizeAnalysisResult {
    isCommonjs: { [name: string]: true }
}

export function unique<T>(array: T[], key = (x: T): any => x): T[] {
    const cache: Record<any, boolean> = {}
    return array.filter(function(a) {
        const keyed = key(a)
        if (!cache[keyed]) {
            cache[keyed] = true
            return true
        }
        return false
    }, {})
}

// namespace:/path/to/file -> /path/to/file
export function stripColon(input?: string) {
    if (!input) {
        return ''
    }
    const index = input.indexOf(':')
    if (index === -1) {
        return input
    }
    const clean = input.slice(index + 1)
    return clean
}

function convertKeys<T>(obj: T, cb: (k: string) => string): T {
    const x: T = Array.isArray(obj) ? ([] as any) : {}

    forOwn(obj, (v, k) => {
        if (isPlainObject(v) || Array.isArray(v)) v = convertKeys(v, cb)

        x[cb(k)] = v
    })

    return x
}

export function runFunctionOnPaths(
    x: Metadata,
    func: (x: string) => string = stripColon,
): Metadata {
    x = convertKeys(x, func)
    for (const input in x.inputs) {
        const v = x.inputs[input]
        x.inputs[input] = {
            ...v,
            imports: v.imports
                ? v.imports.map((x) => ({ path: func(x.path) }))
                : [],
        }
    }
    for (const output in x.outputs) {
        const v = x.outputs[output]
        x.outputs[output] = {
            ...v,
            imports: v.imports
                ? v.imports.map((x) => ({ path: func(x.path) }))
                : [],
        }
    }

    return x
}
