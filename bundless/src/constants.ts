import { logger } from './logger'
import { Loader } from 'esbuild'
import { hmrClientNamespace } from './plugins/hmr-client'
export const DEFAULT_PORT = 3000
export const CLIENT_PUBLIC_PATH = `/_hmr_client.js?namespace=${hmrClientNamespace}`
export const COMMONJS_ANALYSIS_PATH = 'commonjs.json'
export const WEB_MODULES_PATH = 'web_modules'
export const BUNDLE_MAP_PATH = 'bundleMap.json'
export const HMR_SERVER_NAME = 'esm-hmr'
export const CONFIG_NAME = 'bundless.config.js'

export const EXAMPLES_FOLDERS = [
    'react-typescript',
    'react-javascript',
    'vanilla-javascript',
]

export let isRunningWithYarnPnp: boolean = false
try {
    isRunningWithYarnPnp = Boolean(require('pnpapi'))
    logger.debug('Using Yarn PnP')
} catch {}

export const MAIN_FIELDS = ['browser:module', 'browser', 'module', 'main']

export const showGraph = process.env.SHOW_HMR_GRAPH

export const JS_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.mjs',
    '.js',
    '.jsx',
    '.cjs',
])

export const importableAssets = [
    '.jpg',
    '.jpeg',
    '.png',
    '.svg',
    '.gif',
    '.ico',
    '.webp',
    '.jp2',
    '.avif',
    '.woff',
    '.woff2',
    '.ttf',
]

export const hmrPreamble = `import * as  __HMR__ from '${CLIENT_PUBLIC_PATH}'; import.meta.hot = __HMR__.createHotContext(import.meta.url); `
