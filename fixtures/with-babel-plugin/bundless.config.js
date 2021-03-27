const { BabelPlugin } = require('@bundless/plugin-babel')

module.exports = {
    plugins: [
        BabelPlugin({
            babelOptions: {
                plugins: [require('babel-plugin-macros')],
            },
        }),
    ],
}
