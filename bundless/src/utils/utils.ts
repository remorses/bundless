import { parse as _parse } from '@babel/parser'
import { Statement } from '@babel/types'
import escapeStringRegexp from 'escape-string-regexp'
import { EventEmitter, once } from 'events'

import fs from 'fs'
import path from 'path'
import qs, { ParsedQs } from 'qs'
import slash from 'slash'
import { Readable } from 'stream'
import { Config } from '../config'
import { JS_EXTENSIONS } from '../constants'

const imageRE = /\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const cleanUrl = (url: string) =>
    url.replace(hashRE, '').replace(queryRE, '')

export const isStaticAsset = (file: string) => {
    // TODO adds configurable assets extensions
    return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file)
}

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
        throw new Error(`cannot read ${p}, ${e}`)
    }
}

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function(flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten,
        )
    }, [])
}

export function needsPrebundle(config: Config, p: string) {
    if (config.needsPrebundle && config.needsPrebundle(p)) {
        return true
    }
    return p.includes('node_modules') && !p.includes('web_modules') // TODO make something more robust to skip detection of node_modules inside web_modules
}

export function parse(source: string): Statement[] {
    try {
        return _parse(source, {
            sourceType: 'module',
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
        }).program.body
    } catch (e) {
        throw new Error(`Cannot parse with babel: ${e}`)
    }
}

export const jsTypeRegex = new RegExp(
    '(' + [...JS_EXTENSIONS].map(escapeStringRegexp).join('|') + ')$',
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
    private isReady = true
    constructor() {
        super()
    }
    ready() {
        this.emit(this.READY_EVENT)
        this.isReady = true
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
