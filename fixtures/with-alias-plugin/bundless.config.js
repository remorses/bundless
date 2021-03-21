const path = require('path')
const { AliasPlugin } = require('@bundless/plugin-alias')

module.exports = {
    build: {
        minify: false,
    },
    plugins: [
        AliasPlugin({
            entries: [
                { find: 'react', replacement: 'preact/compat' },
                { find: '@virtual', replacement: './text.ts' },
            ],
            // paths: {
            //     'react/*': [require.resolve('preact/compat')],
            //     react: [require.resolve('preact/compat')],
            //     '@virtual': ['text.ts'],
            // },
        }),
    ],
}
