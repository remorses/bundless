import path from 'path'
import { getDependenciesPaths } from './prebundle'

test('getDependenciesPaths', async () => {
    await getDependenciesPaths({
        entryPoints: [path.resolve('fixtures/fixtures/with-imports/main.js')],
        root: __dirname,
    })
})
