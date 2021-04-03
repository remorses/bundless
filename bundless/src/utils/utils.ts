import { parse as _parse } from '@babel/parser'
import picomatch from 'picomatch'
import { ParserOptions } from '@babel/core'
import strip from 'strip-ansi'
import { Statement } from '@babel/types'
import escapeStringRegexp from 'escape-string-regexp'
import { EventEmitter, once } from 'events'

import fs from 'fs'
import path from 'path'
import qs, { ParsedQs } from 'qs'
import slash from 'slash'
import { Readable } from 'stream'
import { Config } from '../config'
import { cleanUrl, queryRE } from './path'
import { JS_EXTENSIONS } from '../constants'

export const jsSrcRE = /\.(?:(?:j|t)sx?|vue)$|\.mjs$/
export const urlRE = /url\(\s*('[^']+'|"[^"]+"|[^'")]+)\s*\)/
export const cssPreprocessLangRE = /\.(less|sass|scss|styl|stylus|postcss)$/
export const cssModuleRE = /\.module\.(less|sass|scss|styl|stylus|postcss|css)$/

export const isCSSRequest = (file: string) =>
    file.endsWith('.css') || cssPreprocessLangRE.test(file)

const externalRE = /^(https?:)?\/\//
export const isExternalUrl = (url: string) => externalRE.test(url)

/**
 * Check if a request is an import from js instead of a native resource request
 * i.e. differentiate
 * `import('/style.css')`
 * from
 * `<link rel="stylesheet" href="/style.css">`
 *
 * The ?import query is injected by serverPluginModuleRewrite.
 */
export const isImportRequest = (ctx): boolean => {
    return ctx.query.import != null
}

const range: number = 2

export function generateCodeFrame(
    source: string,
    start: number = 0,
    end: number = source.length,
): string {
    const lines = source.split(/\r?\n/)
    let count = 0
    const res: string[] = []
    for (let i = 0; i < lines.length; i++) {
        count += lines[i].length + 1
        if (count >= start) {
            for (let j = i - range; j <= i + range || end > count; j++) {
                if (j < 0 || j >= lines.length) continue
                res.push(
                    `${j + 1}${' '.repeat(3 - String(j + 1).length)}|  ${
                        lines[j]
                    }`,
                )
                const lineLength = lines[j].length
                if (j === i) {
                    // push underline
                    const pad = start - (count - lineLength) + 1
                    const length = end > count ? lineLength - pad : end - start
                    res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length))
                } else if (j > i) {
                    if (end > count) {
                        const length = Math.min(end - count, lineLength)
                        res.push(`   |  ` + '^'.repeat(length))
                    }
                    count += lineLength + 1
                }
            }
            break
        }
    }
    return res.join('\n')
}

/**
 * Read already set body on a Koa context and normalize it into a string.
 * Useful in post-processing middlewares.
 */
export async function readBody(
    stream: Readable | Buffer | string | null,
): Promise<string | null> {
    try {
        if (stream instanceof Readable) {
            return new Promise((resolve, reject) => {
                let res = ''
                stream
                    .on('data', (chunk) => (res += chunk))
                    .on('error', reject)
                    .on('end', () => {
                        resolve(res)
                    })
            })
        } else {
            return !stream || typeof stream === 'string'
                ? stream
                : stream.toString()
        }
    } catch (e) {
        throw new Error(`Cannot read body, ${e}`)
    }
}

export const parseWithQuery = (
    id: string,
): {
    path: string
    query: ParsedQs
} => {
    const queryMatch = id.match(queryRE)
    if (queryMatch) {
        return {
            path: slash(cleanUrl(id)),
            query: qs.parse(queryMatch[0].slice(1)),
        }
    }
    return {
        path: id,
        query: {},
    }
}

export async function readFile(p: string) {
    try {
        return await (await fs.promises.readFile(p)).toString()
    } catch (e) {
        // maintains error.code property
        e.message = `cannot read file ${p}, ${e.message}`
        throw e
    }
}

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten,
        )
    }, [])
}

export function needsPrebundle(config: Config, p: string) {
    if (p.includes('node_modules') && !p.includes('.bundless')) {
        return true
    }
    const includeWorkspacePackages = config.prebundle?.includeWorkspacePackages
    if (includeWorkspacePackages != null) {
        if (Array.isArray(includeWorkspacePackages)) {
            const matchers = includeWorkspacePackages.map((g) => picomatch(g))
            return matchers.some((fn) => fn(p))
        }
        if (includeWorkspacePackages === true) {
            // for yarn berry
            if (p.includes('/.yarn/') || p.includes('\\.yarn\\')) {
                return true
            }
            const isOutside = path.relative(config.root!, p).startsWith('..')
            if (isOutside) {
                return true
            }
        }
    }
    return false
}

export const babelParserOpts: ParserOptions = {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    plugins: [
        // required for import.meta.hot
        'importMeta',
        'jsx',
        // by default we enable proposals slated for ES2020.
        // full list at https://babeljs.io/docs/en/next/babel-parser#plugins
        // this should be kept in async with @vue/compiler-core's support range
        'bigInt',
        'optionalChaining',
        'classProperties',
        'nullishCoalescingOperator',
    ],
}

export function parse(
    source: string,
    sourceFilename: string = 'file.tsx',
): Statement[] {
    try {
        return _parse(source, { ...babelParserOpts, sourceFilename }).program
            .body
    } catch (e) {
        throw new Error(`Cannot parse with babel: ${e}`)
    }
}

export const jsTypeRegex = new RegExp(
    '(' + [...JS_EXTENSIONS].map(escapeStringRegexp).join('|') + ')(\\?.*)?$',
)

export function appendQuery(url: string, query: string) {
    if (query.startsWith('?')) {
        query = query.slice(1)
    }
    if (url.includes('?')) {
        return `${url}&${query}`
    }
    return `${url}?${query}`
}

export function partition<T>(
    ary: T[],
    callback: (x: T) => boolean,
): [T[], T[]] {
    const initial: [T[], T[]] = [[], []]
    return ary.reduce((acc, e) => {
        acc[callback(e) ? 0 : 1].push(e)
        return acc
    }, initial)
}

export class Lock extends EventEmitter {
    private READY_EVENT = 'READY_EVENT'
    isReady = true
    constructor() {
        super()
    }
    ready() {
        this.emit(this.READY_EVENT)
    }
    lock() {
        this.isReady = false
        this.once(this.READY_EVENT, () => {
            this.isReady = true
        })
    }
    async wait() {
        if (this.isReady) {
            return
        }
        return once(this, this.READY_EVENT)
    }
}

export function prepareError(err: Error) {
    return {
        ...err,
        message: strip(err.message),
        stack: strip(err.stack || ''),
        // frame: strip(err?.frame || ''),
    }
}

export const sleep = (t) => new Promise((r) => setTimeout(() => r, t))

export function isEmpty(map) {
    return !map || Object.keys(map).length === 0
}

export function computeDuration(
    startTime: number,
    interval = 'seconds',
): string {
    const endTime = Date.now()
    const delta = endTime - startTime
    const intervalMap = {
        seconds: 1000,
    }
    const seconds = delta / (intervalMap[interval] || 1000)
    return seconds.toFixed(2) + ' ' + interval
}

const reservedWords =
    'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public'
const builtins =
    'arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl'

const forbiddenIdentifiers = new Set<string>(
    `${reservedWords} ${builtins}`.split(' '),
)
forbiddenIdentifiers.add('')

export function makeLegalIdentifier(str) {
    let identifier = str
        .replace(/-(\w)/g, (_, letter) => letter.toUpperCase())
        .replace(/[^$_a-zA-Z0-9]/g, '_')

    if (/\d/.test(identifier[0]) || forbiddenIdentifiers.has(identifier)) {
        identifier = `_${identifier}`
    }

    return identifier || '_'
}
