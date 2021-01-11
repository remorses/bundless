const { ReactRefreshPlugin } = require('@bundless/plugin-react-refresh')

/**
 * @type { import('@bundless/cli').Config }
 */
module.exports = {
    plugins: [ReactRefreshPlugin()],
}
