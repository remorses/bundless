module.exports = {
    mount: {
        public: '/',
        src: '/_dist_',
    },
    devOptions: {
        open: 'none',
        output: 'stream',
    },
    plugins: [
        '@snowpack/plugin-react-refresh', // live reloading
    ],
}
