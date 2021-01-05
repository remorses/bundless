import path from 'path'
import { cleanUrl } from './utils'

export const dotdotEncoding = '...'

// maybe keep track of namespace query here?
export function importPathToFile(root: string, request: string) {
    if (!request) {
        return ''
    }
    request = decodeURIComponent(request)
    request = cleanUrl(request)
    request = request.startsWith('/') ? request.slice(1) : request
    request = request.replace(/\.\.\./g, '..')
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
