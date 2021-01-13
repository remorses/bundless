import path from 'path'
import slash from 'slash'
import { cleanUrl } from './utils'

export const dotdotEncoding = '__..__'

// maybe keep track of namespace query here?
export function importPathToFile(root: string, request: string) {
    if (!request) {
        return ''
    }
    request = decodeURIComponent(request)
    request = cleanUrl(request)
    request = request.startsWith('/') ? request.slice(1) : request
    request = request.replace(/__\.\.__/g, '..')
    request = path.resolve(root, request)
    return request
}

export function fileToImportPath(root: string, filePath: string) {
    filePath = path.resolve(root, filePath)
    filePath = path.relative(root, filePath)
    filePath = filePath.replace(/\.\./g, dotdotEncoding)
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
