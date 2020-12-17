import path from "path"
import { cleanUrl } from "./utils"

const dotdot = '...'

// TODO encode non js paths to proxy.js paths? this way i can know when a css file comes from an import?

export function importPathToFile(root: string, request: string) {
    request = decodeURIComponent(request)
    request = cleanUrl(request)
    request = request.startsWith('/') ? request.slice(1) : request
    request = path.resolve(root, request)
    request = request.replace(dotdot, '..')
    return request
}

export function fileToImportPath(root: string, filePath: string) {
    filePath = path.resolve(filePath)
    filePath = path.relative(root, filePath)
    filePath = filePath.replace('..', dotdot)
    filePath = '/' + filePath
    return filePath
}
