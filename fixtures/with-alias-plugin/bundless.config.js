const path = require('path')

module.exports = {
    plugins: [
        {
            name: 'virtual', // alias plugins need to have enforce pre or node resolve will have higher priority
            enforce: 'pre',
            setup({ onResolve }) {
                onResolve({ filter: /@virtual/ }, (arg) => {
                    return {
                        path: path.resolve(__dirname, 'text.ts'),
                    }
                })
                onResolve({ filter: /^react$/ }, (arg) => {
                    return {
                        path: require.resolve('preact'),
                    }
                })
            },
        },
    ],
}
