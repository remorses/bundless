const { SveltePlugin } = require('@bundless/plugin-svelte')

/**
 * @type { import('@bundless/cli').Config }
 */
module.exports = {
    plugins: [SveltePlugin()],
}
