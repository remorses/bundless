import { TraversalGraph } from './analyze'

export function scc(graph: TraversalGraph) {
    const indices = new Map()
    const lowlinks = new Map()
    const onStack = new Set()
    const stack: string[] = []
    const scc: Set<string>[] = []
    let idx = 0

    function strongConnect(v) {
        indices.set(v, idx)
        lowlinks.set(v, idx)
        idx++
        stack.push(v)
        onStack.add(v)

        const deps = graph[v]?.imports || []
        for (const dep of deps) {
            if (!indices.has(dep)) {
                strongConnect(dep)
                lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(dep)))
            } else if (onStack.has(dep)) {
                lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(dep)))
            }
        }

        if (lowlinks.get(v) === indices.get(v)) {
            const vertices = new Set<string>()
            let w: string | undefined
            while (v !== w) {
                w = stack.pop()
                onStack.delete(w)
                vertices.add(w!)
            }
            scc.push(vertices)
        }
    }

    for (const v of Object.keys(graph)) {
        if (!indices.has(v)) {
            strongConnect(v)
        }
    }

    return scc.map((x) => [...x])
}
