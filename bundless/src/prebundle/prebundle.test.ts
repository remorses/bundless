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
