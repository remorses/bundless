/**
 * @type { import('espack').Config }
 */
const config = {
    jsx: 'react',
    entries: ['public/espack/index.html'],
    plugins: [require('espack-plugin-react-refresh').ReactRefreshPlugin()],
}

module.exports = config
