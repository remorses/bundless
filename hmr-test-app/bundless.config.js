/** @type { import('@bundless/cli').Config } */
module.exports = {
    jsx: 'react',
    entries: ['public/bundless/index.html'],
    server: {
        experimentalImmutableCache: false,
    },
    plugins: [require('@bundless/plugin-react-refresh').ReactRefreshPlugin()],
}
