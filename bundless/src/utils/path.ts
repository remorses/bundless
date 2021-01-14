import path from 'path'
import defaultPathImpl from 'path'
import slash from 'slash'
import { cleanUrl } from './utils'

export const dotdotEncoding = '__..__'

// maybe keep track of namespace query here?
export function importPathToFile(
    root: string,
    request: string,
    pathImpl = defaultPathImpl,
) {
    if (!request) {
        return ''
    }
    request = decodeURIComponent(request)
    request = cleanUrl(request)
    request = removeLeadingSlash(request)
    request = request.replace(/__\.\.__/g, '..')
    request = pathImpl.resolve(root, request)
    return request
}

export function fileToImportPath(
    root: string,
    filePath: string,
    pathImpl = defaultPathImpl,
) {
    filePath = pathImpl.resolve(root, filePath)
    const relative = pathImpl.relative(root, filePath)
    filePath = slash(relative)
    filePath = filePath.replace(/\.\.(\/|\\)/g, dotdotEncoding + '$1')
    filePath = '/' + filePath
    return filePath
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


export function removeLeadingSlash(p: string) {
    return p.startsWith('/') ? p.slice(1) : p
}