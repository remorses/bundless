// importee and importers must be relative paths from root, they can be converted to requests just prepending /

import path from 'path'
import chalk from 'chalk'
import { osAgnosticPath } from './prebundle/support'
import { fileToImportPath } from './utils'

// examples are ./main.js and ../folder/main.js
type OsAgnosticPath = string

// examples are /path/file.js or /.../file.js
type ImportPath = string
export interface Node {
    importers(): Set<OsAgnosticPath> // returns osAgnosticPaths
    importees: Set<ImportPath>
    dirtyImportersCount: number // modules that have imported this and have been updated
    isHmrEnabled?: boolean
    hasHmrAccept?: boolean
}

export class Graph {
    // keys are always os agnostic paths and not public paths
    nodes: { [osAgnosticPath: string]: Node } = {}
    root = ''
    constructor({ root }: { root: string }) {
        this.nodes = {}
        this.root = root
    }
    ensureEntry(path: string, newNode?: Partial<Node>): Node {
        path = osAgnosticPath(path, this.root)
        if (this.nodes[path]) {
            Object.assign(this.nodes[path], newNode || {})
            return this.nodes[path]
        }

        this.nodes[path] = {
            dirtyImportersCount: 0,
            hasHmrAccept: false,
            isHmrEnabled: false,
            importees: new Set(),
            ...newNode,
            importers: () => {
                const importPath = fileToImportPath(this.root, path)
                return new Set(
                    Object.entries(this.nodes)
                        .filter(([_, v]) => {
                            return v.importees?.has(importPath)
                        })
                        .map(([k, _]) => k),
                )
            },
        }
        return this.nodes[path]
    }
    toString() {
        const content = Object.keys(this.nodes)
            .map((k) => {
                const node = this.nodes[k]
                let key = path.relative(process.cwd(), k)

                if (node.hasHmrAccept) {
                    key = chalk.redBright(chalk.underline(key))
                } else if (node.isHmrEnabled) {
                    key = chalk.yellow(chalk.underline(key))
                }

                key += ' ' + chalk.cyan(node.dirtyImportersCount)
                return `    ${key} -> ${JSON.stringify(
                    [...node.importees],
                    null,
                    4,
                )
                    .split('\n')
                    .map((x) => '    ' + x)
                    .join('\n')
                    .trim()}`
            })
            .join('\n')
        const legend =
            `\nLegend:\n` +
            // `${'[ ]'} has no HMR\n` +
            `${chalk.redBright('[ ]')} accepts HMR\n` +
            `${chalk.yellow('[ ]')} HMR enabled\n\n`
        return legend + `ImportGraph {\n${content}\n}\n`
    }
}
