import memoize from 'micro-memoize'
import path from 'path'
import { makeEntryObject } from './prebundle'
import { traverseWithEsbuild } from './traverse'

test('traverseWithEsbuild', async () => {
    const entry = path.resolve('fixtures/with-many-dependencies/index.html')
    const deps = await traverseWithEsbuild({
        entryPoints: [entry],
        // esbuildCwd: process.cwd(),
        config: {},
        root: path.dirname(entry),
    })
    expect(deps).toMatchSnapshot()
})

test('memoize', () => {
    let i = 0
    const fn = memoize((x) => {
        return i++
    })
    fn(1)
    fn(1)
    fn.cache.keys = []
    fn.cache.values = []
    fn(1)
    fn(1)
    fn(1)
    expect(i).toBe(2)
})

test('makeEntryObject', () => {
    const deps = ['xxx', 'xxx', 'xxx', 'yyy', 'aaa']
    const obj = makeEntryObject(deps)
    console.log(obj)
    expect(Object.keys(obj).length).toBe(deps.length)
})
