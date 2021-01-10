import { Logger } from '@bundless/cli'
import picomatch from 'picomatch'

export const CLIENT_ENTRY = '_bundless_paged_entry_.jsx'
export const ROUTES_ENTRY = '_bundless_paged_routes_.jsx'
export const jsGlob = '**/*.{ts,tsx,js,jsx}'
export const isJsPage = picomatch(jsGlob)

export const logger = new Logger({ prefix: '[paged] ' })
