// importee and importers must be relative paths from root, they can be converted to requests just prepending /

import path from 'path'

export interface Node {
    importers(): Set<string> // traverses the graph and finds nodes that have this in importees
    importees: Set<string>
    hmr: {
        accepts?: boolean
        declines?: boolean
    }
}

export class Graph {
    nodes: { [path: string]: Node } = {}
    constructor() {
        this.nodes = {}
    }
    ensureEntry(key: string): Node {
        if (this.nodes[key]) {
            return this.nodes[key]
        }

        this.nodes[key] = {
            hmr: {},
            importees: new Set(),
            importers: () => {
                return new Set(
                    Object.entries(this.nodes)
                        .filter(([_, v]) => {
                            return v.importees?.has(key)
                        })
                        .map(([k, _]) => k),
                )
            },
        }
        return this.nodes[key]
    }
    toString() {
        const content = Object.keys(this.nodes)
            .map((k) => {
                const node = this.nodes[k]
                return `  '${path.relative(process.cwd(), k)}' -> [${[
                    ...node.importees,
                ]
                    .map((x) => `'${x}`)
                    .join(', ')}]`
            })
            .join('\n')
        return `Graph {\n${content}\n}\n`
    }
}
