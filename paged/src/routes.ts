import glob from 'fast-glob'
import memoize from 'micro-memoize'
import path from 'path'
import { jsGlob } from './constants'

export const getRpcRoutes = memoize(
    async function getRpcRoutes({
        rpcDir,
    }): Promise<{ relative: string; absolute: string }[]> {
        const files = new Set(
            await glob(jsGlob, {
                cwd: rpcDir,
            }),
        )

        return [...files].map((relative) => {
            return {
                relative,
                absolute: path.resolve(rpcDir, relative),
            }
        })
    },
    { isPromise: true },
)

export const getPagesRoutes = memoize(
    async function getRoutes({ pagesDir }) {
        const files = new Set(
            await glob(jsGlob, {
                cwd: pagesDir,
            }),
        )

        const routes = [...files].map((file) => {
            const filename = `/${file
                .replace(/\.[a-z]+$/, '')
                .replace(/^index$/, '')
                .replace(/\/index$/, '')
                .replace(/\[\.\.\.([^\]]+)\]/g, '*')
                .replace(/\[([^\]]+)\]/g, ':$1')}`
            return {
                path: filename,
                absolute: path.join(pagesDir, file),
                relative: file,
                name: file.replace(/[^a-zA-Z0-9]/g, '_'),
            }
        })
        return routes
    },
    { isPromise: true },
)

export function rpcPathForFile({ filePath, root }) {
    if (!path.isAbsolute(filePath)) {
        throw new Error(`rpcPathForFile needs absolute paths`)
    }
    const relative = path.posix.relative(root, filePath).replace(/\..+$/, '')
    return '/' + relative
}

export function invalidateCache(memoFunction) {
    memoFunction.cache.keys.length = 0
    memoFunction.cache.values.length = 0
}
