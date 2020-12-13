import { Metadata } from 'esbuild'
import { EventEmitter, once } from 'events'
import { forOwn, isPlainObject } from 'lodash'
import path from 'path'
import slash from 'slash'

export function isUrl(req: string) {
    return req.startsWith('http://') || req.startsWith('https://')
}

// TODO import OptimizeAnalysisResult from vite
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

export function osAgnosticPath(absPath?: string | undefined) {
    if (!absPath) {
        return ''
    }
    if (!path.isAbsolute(absPath)) {
        absPath = path.resolve(absPath)
    }
    return slash(path.relative(process.cwd(), absPath))
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

export function removeColonsFromMeta(x: Metadata): Metadata {
    x = convertKeys(x, stripColon)
    for (const input in x.inputs) {
        const v = x.inputs[input]
        x.inputs[input] = {
            ...v,
            imports: v.imports.map((x) => ({ path: stripColon(x.path) })),
        }
    }
    for (const output in x.outputs) {
        const v = x.outputs[output]
        x.outputs[output] = {
            ...v,
            imports: v.imports.map((x) => ({ path: stripColon(x.path) })),
        }
    }

    return x
}
