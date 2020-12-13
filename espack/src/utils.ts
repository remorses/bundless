import path from 'path'
import qs, { ParsedQs } from 'qs'
import slash from 'slash'
import fs from 'fs'
import { Readable } from 'stream'
import { forOwn, isPlainObject } from 'lodash'

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

export function requestToFile(root: string, request: string) {
    request = cleanUrl(request)
    request = request.startsWith('/') ? request.slice(1) : request
    return path.resolve(root, request)
}

export function fileToRequest(root: string, filePath: string) {
    filePath = path.resolve(filePath)
    return '/' + path.relative(root, filePath)
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

export function isNodeModule(p: string) {
    return p.includes('node_modules')
}
