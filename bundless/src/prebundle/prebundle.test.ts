import memoize from 'micro-memoize'
import path from 'path'
import { getDependenciesPaths } from './prebundle'
import { traverseWithEsbuild } from './traverse'

test('traverseWithEsbuild', async () => {
    const entry = path.resolve('fixtures/with-many-dependencies/index.html')
    const deps = await traverseWithEsbuild({
        entryPoints: [entry],
        esbuildCwd: process.cwd(),
        stopTraversing: (x) => x.includes('node_module'),
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
