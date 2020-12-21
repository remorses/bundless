import path from 'path'
import { getDependenciesPaths } from './prebundle'

test('getDependenciesPaths', async () => {
    const entry = path.resolve('fixtures/with-many-dependencies/index.html')
    const deps = await getDependenciesPaths({
        entryPoints: [entry],
        root: path.dirname(entry),
    })
    expect(deps).toMatchSnapshot()
})
