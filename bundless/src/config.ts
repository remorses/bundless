import { CONFIG_NAME, DEFAULT_PORT } from './constants'
import findUp from 'find-up'
import fs from 'fs'
import * as esbuild from 'esbuild'
import { Plugin } from './plugin'
import path from 'path'

export function getEntries(config: Config): string[] {
    if (config.entries) {
        for (let entry of config.entries) {
            if (config.platform === 'browser' && !entry.endsWith('.html')) {
                throw new Error(
                    `Currently when targeting browser entries can only be html files: ${entry}`,
                )
            }
        }
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

export type Platform = 'node' | 'browser'

export interface Config {
    server?: ServerConfig
    build?: BuildConfig
    platform?: Platform
    root?: string
    force?: boolean
    env?: Record<string, string>
    entries?: string[]

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

export interface ServerConfig {
    openBrowser?: boolean
    cors?: boolean
    port?: number | string
    hmr?: HmrConfig | boolean
}

export const defaultConfig: Config = {
    server: {
        openBrowser: false,
        port: DEFAULT_PORT,
        hmr: true,
    },
    platform: 'browser',
    jsx: 'react',
    plugins: [],
}

export function loadConfig(from: string, name = CONFIG_NAME): Config {
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

export interface BuildConfig {
    basePath?: string
    outDir?: string
    minify?: boolean
    jsTarget?: string
}
