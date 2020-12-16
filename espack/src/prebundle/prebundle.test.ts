import path from 'path'
import { getDependenciesPaths } from './prebundle'

test('getDependenciesPaths', async () => {
    await getDependenciesPaths({
        entryPoints: [path.resolve('fixtures/with-imports/main.js')],
        root: __dirname,
    })
})
