/**
 * @type { import('espack').Config }
 */
const config = {
    jsx: 'react',

    plugins: [require('espack-plugin-react-refresh').ReactRefreshPlugin()],
}

module.exports = config
