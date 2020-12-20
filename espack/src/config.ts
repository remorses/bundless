import { CONFIG_NAME, DEFAULT_PORT } from './constants'
import findUp from 'find-up'
import { Plugin } from './plugin'

export interface Config {
    root?: string
    port?: number | string
    cors?: boolean
    hmr?: HmrConfig | boolean
    openBrowser?: boolean
    plugins?: Plugin[]
    jsx?:
        | 'vue'
        | 'preact'
        | 'react'
        | {
              factory?: string
              fragment?: string
          }
}

export const defaultConfig: Config = {
    port: DEFAULT_PORT,
    jsx: 'react',
    plugins: [],
    openBrowser: true,
}

export function loadConfig(from: string): Config {
    const configPath = findUp.sync(CONFIG_NAME, { cwd: from })
    if (configPath) {
        return require(configPath)
    }
    // TODO handle ts config
    return {}
}

export interface HmrConfig {
    protocol?: string
    hostname?: string
    port?: number
    path?: string
    /**
     * If you are using hmr ws proxy, it maybe timeout with your proxy program.
     * You can set this option to let client send ping socket to keep connection alive.
     * The option use `millisecond` as unit.
     * @default 30000ms
     */
    timeout?: number
}
