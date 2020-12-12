import path from 'path'
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
    return path.resolve(path.relative(root, request))
}


export function fileToRequest(root: string, filePath: string) {
    filePath = path.resolve(filePath)
    return '/' + path.relative(root, filePath)
}
