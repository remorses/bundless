const fs = require('fs')
const path = require('path')

/**
 * @type { import('@bundless/cli').Config }
 */
module.exports = {
    plugins: [
        {
            name: 'onLoad',
            setup({ onLoad }) {
                onLoad({ filter: /\.gql/ }, (arg) => {
                    return {
                        loader: 'js',
                        contents: `export default ${JSON.stringify(
                            fs.readFileSync(arg.path).toString(),
                        )}`,
                    }
                })
            },
        },
        {
            name: 'onResolve',
            setup({ onResolve }) {
                onResolve({ filter: /\.fake/ }, (arg) => {
                    return {
                        path: path.resolve(__dirname, 'fake.js'),
                    }
                })
            },
        },
    ],
}
