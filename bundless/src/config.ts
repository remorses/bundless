import { CONFIG_NAME, DEFAULT_PORT } from './constants'
import findUp from 'find-up'
import fs from 'fs'
import { Plugin } from './plugin'
import path from 'path'

export function getEntries(config: Config): string[] {
    if (config.entries) {
        return config.entries.map((x) => path.resolve(config.root!, x))
    }
    const index1 = path.resolve(config.root!, 'index.html')
    if (fs.existsSync(index1)) {
        return [index1]
    }
    const index2 = path.resolve(config.root!, 'public/index.html')
    if (fs.existsSync(index2)) {
        return [index2]
    }
    throw new Error(
        `Cannot find entries, neither config.entries, index.html or public/index.html files are present`,
    )
}

export interface Config {
    root?: string
    port?: number | string
    entries?: string[]
    cors?: boolean
    hmr?: HmrConfig | boolean
    openBrowser?: boolean
    plugins?: Plugin[]
    // TODO replace needsPrebundle with something less generic, like bundle workspaces, do not bundle node_modules, ....
    needsPrebundle?: (p: string) => boolean
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
    hmr: true,
    plugins: [],
    openBrowser: true,
}

export function loadConfig(from: string, name): Config {
    const configPath = findUp.sync(name, { cwd: from })
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
