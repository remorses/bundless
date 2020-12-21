/**
 * @type { import('@bundless/cli').Config }
 */
const config = {
    jsx: 'react',
    entries: ['public/bundless/index.html'],
    plugins: [require('@bundless/plugin-react-refresh').ReactRefreshPlugin()],
}

module.exports = config
