import { logger } from './logger'
import * as esbuild from 'esbuild'

export let isRunningWithYarnPnp: boolean = false
export let pnpapi: any
try {
    pnpapi = require('pnpapi')
    isRunningWithYarnPnp = Boolean(pnpapi)

    logger.debug('Using Yarn PnP')
} catch {}

export const hmrClientNamespace = 'hmr-client'
export const DEFAULT_PORT = 3000
export const CLIENT_PUBLIC_PATH = `/_hmr_client.js?namespace=${hmrClientNamespace}`
export const COMMONJS_ANALYSIS_PATH = '.bundless/commonjs.json'
export const WEB_MODULES_PATH = '.bundless/node_modules'

export const BUNDLE_MAP_PATH = '.bundless/bundleMap.json'
export const HMR_SERVER_NAME = 'esm-hmr'
export const CONFIG_NAME = 'bundless.config.js'

export const EXAMPLES_FOLDERS = [
    'react-typescript',
    'react-javascript',
    'vanilla-javascript',
    'svelte',
]

export const MAIN_FIELDS = ['browser:module', 'browser', 'module', 'main']

export const showGraph = process.env.SHOW_HMR_GRAPH

export const JS_EXTENSIONS = ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.cjs']

export const defaultLoader: Record<string, esbuild.Loader> = {
    '.jpg': 'file',
    '.jpeg': 'file',
    '.png': 'file',
    '.svg': 'dataurl',
    '.gif': 'file',
    '.ico': 'file',
    '.webp': 'file',
    '.jp2': 'file',
    '.avif': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
}
export const defaultImportableAssets = Object.keys(defaultLoader)

export const hmrPreamble = `import * as  __HMR__ from '${CLIENT_PUBLIC_PATH}'; import.meta.hot = __HMR__.createHotContext(import.meta.url); `
