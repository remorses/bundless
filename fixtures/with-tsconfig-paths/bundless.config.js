const path = require('path')
const { TsconfigPathsPlugin } = require('@bundless/plugin-tsconfig-paths')

module.exports = {
    build: {
        minify: false,
    },
    plugins: [
        TsconfigPathsPlugin({
            paths: {
                '@virtual': ['text.ts'],
            },
        }),
    ],
}
