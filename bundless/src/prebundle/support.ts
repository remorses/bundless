import { Metadata } from 'esbuild'
import { EventEmitter, once } from 'events'
import { forOwn, isPlainObject } from 'lodash'
import path from 'path'
import slash from 'slash'

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

export class Lock extends EventEmitter {
    READY_EVENT = 'READY_EVENT'
    isReady = false
    constructor() {
        super()
        this.once(this.READY_EVENT, () => {
            this.isReady = true
        })
    }
    ready() {
        this.emit(this.READY_EVENT)
    }
    wait(): Promise<any> {
        return once(this, this.READY_EVENT)
    }
}

export function osAgnosticPath(absPath: string | undefined, root: string) {
    if (!root) {
        throw new Error(
            `root argument is required, cannot make os agnostic path for ${absPath}`,
        )
    }
    if (!absPath) {
        return ''
    }
    if (!path.isAbsolute(absPath)) {
        absPath = path.resolve(root, absPath)
    }
    return slash(path.relative(root, absPath))
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
