import { Plugin } from '@bundless/cli'
import * as esbuild from 'esbuild'
import escapeStringRegexp from 'escape-string-regexp'
import { platform } from 'os'
import slash from 'slash'

export default AliasPlugin

export function AliasPlugin(options: AliasOptions = {}): Plugin {
    return {
        name: 'alias-plugin', // alias plugins need to have enforce pre or node resolve will have higher priority
        enforce: 'pre',
        setup({ onResolve, pluginsExecutor }) {
            const entries = getEntries(options)

            if (entries.length === 0) {
                return {
                    name: 'alias-plugin',
                    resolveId: noop,
                }
            }
            const filterRegexes: RegExp[] = flatten(
                entries.map((x) => x.find as any),
            ).map((x: any) =>
                typeof x === 'string'
                    ? new RegExp('(' + escapeStringRegexp(x) + ')')
                    : x,
            )
            const resolver = (arg: esbuild.OnResolveArgs) => {
                const importee = arg.path
                const importer = arg.importer
                const importeeId = normalizeId(importee)
                const importerId = normalizeId(importer)

                // First match is supposed to be the correct one
                const matchedEntry = entries.find((entry) =>
                    matches(entry.find, importeeId),
                )
                if (!matchedEntry || !importerId) {
                    return null
                }

                const updatedId = normalizeId(
                    importeeId.replace(
                        matchedEntry.find,
                        matchedEntry.replacement,
                    ),
                )
                if (!updatedId) {
                    return null
                }

                return pluginsExecutor
                    .resolve({
                        ...arg,
                        importer,
                        path: updatedId, // TODO pass plugin data to let this plugin skip itself from running
                    })
                    .then((resolved) => {
                        if (!resolved) {
                            resolved = { path: updatedId }
                        }

                        return resolved
                    })
            }
            filterRegexes.forEach((filter) => {
                onResolve({ filter }, resolver)
            })
        },
    }
}

const VOLUME = /^([A-Z]:)/i
const IS_WINDOWS = platform() === 'win32'

const noop = () => null

function matches(pattern: string | RegExp, importee: string) {
    if (pattern instanceof RegExp) {
        return pattern.test(importee)
    }
    if (importee.length < pattern.length) {
        return false
    }
    if (importee === pattern) {
        return true
    }
    const importeeStartsWithKey = importee.indexOf(pattern) === 0
    const importeeHasSlashAfterKey =
        importee.substring(pattern.length)[0] === '/'
    return importeeStartsWithKey && importeeHasSlashAfterKey
}

function normalizeId(id: string): string
function normalizeId(id: string | undefined): string | undefined
function normalizeId(id: string | undefined) {
    if (typeof id === 'string' && (IS_WINDOWS || VOLUME.test(id))) {
        return slash(id.replace(VOLUME, ''))
    }
    return id
}

function getEntries({ entries }: AliasOptions): readonly Alias[] {
    if (!entries) {
        return []
    }

    if (Array.isArray(entries)) {
        return entries
    }

    return Object.entries(entries).map(([key, value]) => {
        return { find: key, replacement: value }
    })
}

export interface AliasOptions {
    entries?: readonly Alias[] | { [find: string]: string }
}

interface Alias {
    find: string | RegExp
    replacement: string
}

function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten,
        )
    }, [])
}
