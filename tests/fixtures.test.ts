// TODO tests to check all traversed files are served with js content type
// TODO snapshot tests for the response headers
// TODO snapshot tests for the result of traversing the server results

import { traverseEsModules, urlResolver } from 'es-module-traversal'
import { serve } from 'espack'
import { jsTypeRegex } from 'espack/dist/utils'
import fs from 'fs-extra'
import glob from 'glob'
import fetch from 'node-fetch'
import path from 'path'
import slash from 'slash'
import { URL } from 'url'
import { isUrl, osAgnosticResult } from './utils'

require('jest-specific-snapshot')
import * as failFast from 'jasmine-fail-fast'
const jasmineEnv = (jasmine as any).getEnv()
jasmineEnv.addReporter(failFast.init())

declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchSpecificSnapshot(path: string, name?: string): R
        }
    }
}

it('works', async () => {
    const currentFile = path.resolve(__dirname, __filename)
    const res = await traverseEsModules({
        entryPoints: [currentFile],
    })
})
describe('snapshots', () => {
    const casesPath = 'fixtures'
    const cases = fs
        .readdirSync(casesPath, {
            withFileTypes: true,
        })
        .filter((x) => x.isDirectory())
        .map((x) => x.name)
        .map((x) => path.posix.join(casesPath, x))

    const PORT = '9000'
    const baseUrl = `http://localhost:${PORT}`
    for (let casePath of cases) {
        const snapshotFile = path.resolve(casePath, '__snapshots__')
        it(`${slash(casePath)}`, async () => {
            const root = path.resolve(casePath)
            const server = await serve({ port: PORT, root })
            try {
                const downloadFilesToDir = path.join(casePath, 'mirror')
                const contentTypes = {}
                const res = await traverseEsModules({
                    entryPoints: [new URL('index.html', baseUrl).toString()],
                    resolver: urlResolver({ root: casePath, baseUrl }),
                    onEntry: async (url = '', importer) => {
                        let content = ''
                        if (!url) {
                            return
                        }
                        if (!isUrl(url)) {
                            content = await (await fs.readFile(url)).toString()
                        } else {
                            const res = await fetch(url, {
                                headers: {
                                    ...(importer ? { Referer: importer } : {}),
                                },
                            })
                            if (!res.ok) {
                                throw new Error(
                                    `Cannot fetch '${url}', referer is '${importer}': ${
                                        res.statusText
                                    } ${await res.text().catch(() => '')}`,
                                )
                            }
                            contentTypes[url] = res.headers.get('content-type')
                            content = await res.text()
                        }
                        // download files
                        let filePath = url.startsWith('http')
                            ? urlToRelativePath(url)
                            : path.relative(root, url)

                        filePath = path.join(downloadFilesToDir, filePath)

                        await fs.createFile(filePath)
                        await fs.writeFile(filePath, content)
                    },
                })
                for (let url in contentTypes) {
                    if (!url.endsWith('.html')) {
                        expect(contentTypes[url]).toContain('application/javascript')
                    }
                }
                expect(contentTypes).toMatchSpecificSnapshot(
                    snapshotFile,
                    'content-type headers',
                )
                expect(res.map(osAgnosticResult)).toMatchSpecificSnapshot(
                    snapshotFile,
                    'traverse result',
                )
                const allFiles = glob.sync(`**/*`, {
                    ignore: ['__snapshots__'],
                    cwd: downloadFilesToDir,
                    nodir: true,
                })
                expect(allFiles).toMatchSpecificSnapshot(snapshotFile, 'mirror')
            } finally {
                await server.close()
            }
        })
    }
})

function urlToRelativePath(ctx) {
    let pathname = new URL(ctx).pathname
    pathname = pathname.startsWith('/') ? pathname.slice(1) : pathname
    return pathname
}
