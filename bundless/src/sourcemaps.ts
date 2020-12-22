import merge from 'merge-source-map'
import { RawSourceMap } from 'source-map'

export function mergeSourceMap(
    oldMap: RawSourceMap | null | undefined,
    newMap: RawSourceMap,
): RawSourceMap {
    if (!oldMap) {
        return newMap
    }
    // merge-source-map will overwrite original sources if newMap also has
    // sourcesContent
    newMap.sourcesContent = []
    return merge(oldMap, newMap) as RawSourceMap
}

export function genSourceMapString(map: RawSourceMap | string | undefined) {
    if (typeof map !== 'string') {
        map = JSON.stringify(map)
    }
    return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
        map,
    ).toString('base64')}`
}
