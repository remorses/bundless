import { serve } from '@bundless/cli'
import { Config } from '@bundless/cli'
import { spawn } from 'child_process'
import {
    readFromUrlOrPath,
    traverseEsModules,
    urlResolver,
} from 'es-module-traversal'
import { once } from 'events'
import execa from 'execa'
import fs from 'fs-extra'
import * as failFast from 'jasmine-fail-fast'
import 'jest-specific-snapshot'
import path from 'path'
import url, { URL } from 'url'
import WebSocket from 'ws'

const jasmineEnv = (jasmine as any).getEnv()
jasmineEnv.addReporter(failFast.init())

const tempDir = path.resolve(__dirname, '../temp')
const fixtureDir = path.resolve(__dirname)
const testTargets = process.env.HRM_TESTS
    ? ['snowpack', 'vite', 'bundless']
    : ['bundless']

const PORT = 4000

jest.setTimeout(100000)

type TestCase = {
    path: string
    replacer: (content: string) => string
}

process.env.NODE_ENV = 'development' // fix for snowpack that does not start in test env

const config: Config = {
    ...require('./bundless.config'),
    server: {
        openBrowser: false,
        port: PORT,
    },
    root: tempDir,
}

// test cases are arrays of arrays, this way i can test multiple messages cases, i can fetch between cases and snapshot the changed urls, this way i can test the timestamp queries
const testCases: Array<TestCase | TestCase[]> = [
    {
        path: 'src/main.jsx',
        replacer: defaultReplacer,
    },
    {
        path: 'src/file.jsx',
        replacer: defaultReplacer,
    },
    {
        path: 'src/file.css',
        replacer: defaultReplacer,
    },
    {
        path: 'src/file.module.css',
        replacer: defaultReplacer,
    },
    {
        path: 'src/file.json',
        replacer: defaultReplacer,
    },
    {
        path: 'src/file2.js',
        replacer: defaultReplacer,
    },
    {
        path: 'src/imported-many-times.js',
        replacer: defaultReplacer,
    },
    // test 2 consecutive updates that resets the ?timestamp query and could cause a stale fetch
    [
        {
            path: 'src/file2.js',
            replacer: defaultReplacer,
        },
        {
            path: 'src/file.jsx', // imports the first file, should use the last used timestamp query to not get the stale module
            replacer: defaultReplacer,
        },
    ],
    // TODO test hmr when removing an import
    // TODO test hmr when adding an import
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
        case 'bundless': {
            const server = await serve(config)
            // await sleep(300)
            return {
                stop: () => server.close(),
                entry: '/bundless/index.html',
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
    const baseUrl = `http://127.0.0.1:${PORT}`

    const root = tempDir

    for (let testTarget of testTargets) {
        for (let [i, testCase] of testCases.entries()) {
            const name = Array.isArray(testCase)
                ? testCase.map((x) => x.path).join(', ')
                : testCase.path
            test(`${i + 1} ${name} ${testTarget}`, async () => {
                const { stop, entry, hmrAgent } = await start(testTarget)
                try {
                    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`, hmrAgent)
                    await once(ws, 'open')
                    const cases = Array.isArray(testCase)
                        ? testCase
                        : [testCase]
                    const snapshot = path.resolve(
                        fixtureDir,
                        '__snapshots__',
                        testTarget,
                    )

                    // creates the module graph
                    const traversedFiles = await traverseEsModules({
                        entryPoints: [new URL(entry, baseUrl).toString()],
                        onNonResolved: () => {},
                        resolver: urlResolver({
                            root,
                            baseUrl,
                        }),
                    })
                    // register hot modules in graph
                    await registerHotModules(traversedFiles, ws)

                    for (let c of cases) {
                        const messages = await getWsMessages({
                            ws,
                            doing: async () => {
                                await updateFile(
                                    path.resolve(root, c.path),
                                    c.replacer,
                                )
                            },
                        })
                        expect(
                            messages.map(normalizeHmrMessage),
                        ).toMatchSpecificSnapshot(snapshot, 'messages')

                        const urls = new Set<string>()
                        await traverseEsModules({
                            entryPoints: [new URL(entry, baseUrl).toString()],
                            onNonResolved: () => {},
                            onEntry: (p, importer, contents) => {
                                if (p.includes('t=') || p.includes('mtime=')) {
                                    urls.add(p)
                                }
                                // snapshot the fetched urls
                            },
                            resolver: urlResolver({
                                root,
                                baseUrl,
                            }),
                        })
                        expect(urls).toMatchSpecificSnapshot(snapshot, 'urls')
                    }
                    ws.close()
                    await once(ws, 'close')
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

async function getWsMessages({ doing, timeout = 2000, ws }) {
    await doing()
    const messages = []
    ws.addEventListener('message', ({ data }) => {
        const payload = JSON.parse(data)
        if (payload.type === 'connected') return
        // for vite
        if (payload.type === 'multi') {
            return messages.push(...payload.updates)
        }
        return messages.push(payload)
    })
    await Promise.race([
        waitUntilCountStabilizes(() => messages.length),
        sleep(timeout),
    ])

    return messages
}

async function registerHotModules(traversedFiles, ws) {
    // for bundless and snowpack, you need to mark modules as hot
    const messages: string[] = await Promise.all(
        traversedFiles.map(async ({ resolvedImportPath, importPath }) => {
            const content = await readFromUrlOrPath(
                resolvedImportPath,
                importPath,
            )
            if (content.includes('import.meta.hot.accept')) {
                const msg = JSON.stringify(
                    {
                        // id is for snowpack
                        id: url.parse(resolvedImportPath).pathname,
                        path: url.parse(resolvedImportPath).pathname,
                        type: 'hotAccept',
                    },
                    null,
                    4,
                )

                return msg
            }
            return ''
        }),
    )
    messages.filter(Boolean).forEach((x) => ws.send(x))
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

function defaultReplacer(x) {
    return x + '\n\n'
}
