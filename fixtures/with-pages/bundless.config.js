/**
 * @type { import('@bundless/cli').Config }
 */
const config = {
    entries: ['index.html', 'about/index.html'],
    plugins: [require('@bundless/plugin-react-paged').Plugin()],
}

module.exports = config
