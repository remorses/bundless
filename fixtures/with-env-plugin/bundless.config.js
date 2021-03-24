const path = require('path')
const { EnvPlugin } = require('@bundless/cli/dist/plugins')

module.exports = {
    build: {
        minify: false,
    },
    plugins: [
        EnvPlugin({
            envFiles: ['envfile'],
        }),
    ],
}
