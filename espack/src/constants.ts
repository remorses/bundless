export const DEFAULT_PORT = 3000
export const CLIENT_PUBLIC_PATH = '/_hmr_client.js'
export const COMMONJS_ANALYSIS_PATH = 'commonjs.json'
export const WEB_MODULES_PATH = 'web_modules'
export const HMR_SERVER_NAME = 'esm-hmr'

export let isRunningWithYarnPnp: boolean
try {
    isRunningWithYarnPnp = Boolean(require('pnpapi'))
} catch {}

export const JS_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.mjs',
    '.js',
    '.jsx',
    '.cjs',
    // '.vue',
    // '.scss',
    // '.css',
])
