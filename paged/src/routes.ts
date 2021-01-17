import glob from 'fast-glob'
import memoize from 'micro-memoize'
import path, { normalize } from 'path'
import { jsGlob } from './constants'

export interface Route {
    path: string
    relative: string
    absolute: string
    name: string
}

export const getRpcRoutes = memoize(
    async function getRpcRoutes({ rpcDir }): Promise<Route[]> {
        const files = new Set(
            await glob(jsGlob, {
                cwd: rpcDir,
            }),
        )

        const routes = [...files].map((relative) => {
            return {
                relative,
                path: getRouteFromPath(path.join('rpc', relative)),
                absolute: path.resolve(rpcDir, relative),
                name: nameFromPath(relative),
            }
        })
        return routes
    },
    { isPromise: true },
)

export const getPagesRoutes = memoize(
    async function getRoutes({ pagesDir }): Promise<Route[]> {
        const files = new Set(
            await glob(jsGlob, {
                cwd: pagesDir,
            }),
        )

        const routes = [...files].map((relative) => {
            return {
                path: getRouteFromPath(relative),
                absolute: path.join(pagesDir, relative),
                relative: relative,
                name: nameFromPath(relative),
            }
        })
        return routes
    },
    { isPromise: true },
)

export function nameFromPath(p: string) {
    return p.replace(/[^a-zA-Z0-9]/g, '_')
}

function getRouteFromPath(relativePath: string) {
    if (path.isAbsolute(relativePath)) {
        throw new Error(`getRouteFromPath only accepts relative paths`)
    }
    if (relativePath.startsWith('.')) {
        relativePath = path.normalize(relativePath)
    }

    const routePath = `/${relativePath
        .replace(/\.[a-z]+$/, '') // remove extension
        .replace(/^index$/, '')
        .replace(/\/index$/, '')
        .replace(/\[\.\.\.([^\]]+)\]/g, '*') // [...slug] becomes *
        .replace(/\[([^\]]+)\]/g, ':$1')}` // [slug] becomes :slug
    return routePath
}

export function invalidateCache(memoFunction) {
    memoFunction.cache.keys.length = 0
    memoFunction.cache.values.length = 0
}
