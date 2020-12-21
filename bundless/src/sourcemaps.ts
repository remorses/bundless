import merge from 'merge-source-map'

export interface SourceMap {
    version: number | string
    file: string
    sources: string[]
    sourcesContent: string[]
    names: string[]
    mappings: string
}

export function mergeSourceMap(
    oldMap: SourceMap | null | undefined,
    newMap: SourceMap,
): SourceMap {
    if (!oldMap) {
        return newMap
    }
    // merge-source-map will overwrite original sources if newMap also has
    // sourcesContent
    newMap.sourcesContent = []
    return merge(oldMap, newMap) as SourceMap
}

export function genSourceMapString(map: SourceMap | string | undefined) {
    if (typeof map !== 'string') {
        map = JSON.stringify(map)
    }
    return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
        map,
    ).toString('base64')}`
}
