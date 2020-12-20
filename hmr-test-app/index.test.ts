import {
    readFromUrlOrPath,
    traverseEsModules,
    urlResolver,
} from 'es-module-traversal'
import { once } from 'events'
import { exec, spawn } from 'child_process'
import { serve } from 'espack'
import execa from 'execa'
import fs from 'fs-extra'
import path from 'path'
import url, { URL } from 'url'
import WebSocket from 'ws'
import { ReactRefreshPlugin } from 'espack-plugin-react-refresh'
import 'jest-specific-snapshot'
import * as failFast from 'jasmine-fail-fast'
import { Config } from 'espack/dist/config'
const jasmineEnv = (jasmine as any).getEnv()
jasmineEnv.addReporter(failFast.init())

const tempDir = path.resolve('temp')
const fixtureDir = path.resolve('hmr-test-app')
const testTargets = process.env.HRM_TESTS
    ? ['snowpack', 'vite', 'espack']
    : ['espack']

const PORT = 4000

jest.setTimeout(100000)

type TestCase = {
    name?: string
    path: string
    replacer: (content: string) => string
}

process.env.NODE_ENV = 'development' // fix for snowpack that does not start in test env

const config: Config = {
    port: PORT,
    root: tempDir,
    openBrowser: false,
    plugins: [ReactRefreshPlugin()],
}

// TODO test when removing an import
// TODO test when adding an import
// TODO test 2 consecutive updates that resets the ?timestamp query and could cause a stale fetch
// 

const testCases: TestCase[] = [
    {
        path: 'src/main.jsx',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/file.jsx',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/file.css',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/file.module.css',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/file.json',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/file2.js',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
    {
        path: 'src/imported-many-times.js',
        replacer: (content) => {
            return content + '\n\n'
        },
    },
]

beforeAll(async () => {
    try {
        await fs.remove(tempDir)
    } catch (e) {}
    await fs.ensureDir(tempDir)
    await fs.copy(fixtureDir, tempDir, {
        filter: (file) => !/dist|node_modules/.test(file),
    })
    const json = JSON.parse(
        fs.readFileSync(path.resolve(fixtureDir, 'package.json')).toString(),
    )
    fs.writeFileSync(
        path.resolve(tempDir, 'package.json'),
        JSON.stringify({ ...json, name: 'temp' }, null, 4),
    )
    await execa('yarn', { cwd: tempDir, stdio: 'inherit' })
})

afterAll(async () => {
    try {
        await fs.remove(tempDir)
    } catch (e) {}
})

async function start(type) {
    console.info('starting hmr tests')
    let finish
    let complete = new Promise((r) => {
        finish = r
    })
    switch (type) {
        case 'espack': {
            const server = await serve(config)
            // await sleep(300)
            return {
                stop: () => server.close(),
                entry: '/espack/index.html',
                hmrAgent: 'esm-hmr',
            }
        }
        case 'snowpack': {
            const p = spawn(`yarn snowpack dev --port ${PORT}`, {
                cwd: tempDir,
                stdio: 'pipe',
                env: {
                    ...process.env,
                    NODE_ENV: 'development',
                },
                shell: true,
            })
            function onData(data) {
                process.stdout.write(data + '\n')
                if (data.includes('Server started')) {
                    finish()
                }
            }
            p.stderr.on('data', onData)
            p.stdout.on('data', onData)
            await complete
            await sleep(300)
            return {
                stop: () => p.kill('SIGTERM'),
                entry: '/snowpack/index.html',
                hmrAgent: 'esm-hmr',
            }
        }
        case 'vite': {
            const p = spawn(`yarn vite serve --port ${PORT}`, {
                cwd: tempDir,
                stdio: 'pipe',
                env: {
                    ...process.env,
                    NODE_ENV: 'development',
                },
                shell: true,
            })
            function onData(data) {
                process.stdout.write(data + '\n')
                if (data.includes('Dev server running at:')) {
                    finish()
                }
            }
            p.stderr.on('data', onData)
            p.stdout.on('data', onData)
            await complete
            await sleep(400)
            return {
                stop: () => p.kill('SIGTERM'),
                entry: '/vite/index.html',
                hmrAgent: 'vite-hmr',
            }
        }
        default: {
            throw new Error(`${type} not handled`)
        }
    }
}

describe('hmr', () => {
    const baseUrl = `http://localhost:${PORT}`

    const root = tempDir

    for (let testTarget of testTargets) {
        for (let [i, testCase] of testCases.entries()) {
            const name = testCase.name || testCase.path
            test(`${i + 1} ${name} ${testTarget}`, async () => {
                const { stop, entry, hmrAgent } = await start(testTarget)
                try {
                    const traversedFiles = await traverseEsModules({
                        entryPoints: [new URL(entry, baseUrl).toString()],
                        onNonResolved: () => {},
                        resolver: urlResolver({
                            root,
                            baseUrl,
                        }),
                    })
                    // console.log(traversedFiles.map((x) => x.importPath))
                    const ws = new WebSocket(`ws://localhost:${PORT}`, hmrAgent)
                    await once(ws, 'open')
                    // await once(ws, 'message')
                    await Promise.all(
                        traversedFiles.map(
                            async ({ resolvedImportPath, importPath }) => {
                                const content = await readFromUrlOrPath(
                                    resolvedImportPath,
                                    importPath,
                                )
                                if (
                                    content.includes('import.meta.hot.accept')
                                ) {
                                    const msg = JSON.stringify(
                                        {
                                            // id is for snowpack
                                            id: url.parse(resolvedImportPath)
                                                .pathname,
                                            // path is for espack
                                            path: url.parse(resolvedImportPath)
                                                .pathname,
                                            type: 'hotAccept',
                                        },
                                        null,
                                        4,
                                    )
                                    // console.log({ msg })
                                    ws.send(msg)
                                }
                            },
                        ),
                    )

                    const messages = await getWsMessages({
                        ws,
                        doing: async () => {
                            await updateFile(
                                path.resolve(root, testCase.path),
                                testCase.replacer,
                            )
                        },
                    })
                    expect(
                        messages.map(normalizeHmrMessage),
                    ).toMatchSpecificSnapshot(
                        path.resolve(fixtureDir, '__snapshots__', testTarget),
                        '',
                    )
                } finally {
                    if (stop) await stop()
                    await sleep(300)
                }
            })
        }
    }
})

async function updateFile(compPath, replacer) {
    try {
        const content = await fs.readFile(compPath, 'utf-8')
        await fs.writeFile(compPath, replacer(content))
    } catch (e) {
        throw new Error(`could not update ${compPath}: ${e}`)
    }
}

async function getWsMessages({ doing, timeout = 1000, ws }) {
    await doing()
    const messages = []
    ws.addEventListener('message', ({ data }) => {
        const payload = JSON.parse(data)
        if (payload.type === 'connected') return
        if (payload.type === 'multi') {
            return messages.push(...payload.updates)
        }
        return messages.push(payload)
    })
    await Promise.race([
        waitUntilCountStabilizes(() => messages.length),
        sleep(timeout),
    ])
    ws.close()
    await once(ws, 'close')
    return messages
}

const sleep = (n) => new Promise((r) => setTimeout(r, n))

async function waitUntilCountStabilizes(count, releaseTime = 50) {
    let lastCount = 0
    while (!lastCount) {
        await sleep(50)
        lastCount = count()
    }
    await sleep(releaseTime)
    if (count() !== lastCount) {
        return await waitUntilCountStabilizes(count, releaseTime)
    }
}

const normalizeHmrMessage = (message) => {
    const ignoreKeys = ['timestamp']
    const validKeys = Object.keys(message).filter(
        (k) => !ignoreKeys.includes(k),
    )
    return Object.assign({}, ...validKeys.map((k) => ({ [k]: message[k] })))
}
