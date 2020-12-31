/**
 * @type { import('@bundless/cli').Config }
 */
const config = {
    plugins: [require('@bundless/plugin-react-paged').Plugin()],
}

module.exports = config
