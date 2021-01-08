import { CONFIG_NAME, DEFAULT_PORT } from './constants'
import findUp from 'find-up'
import fs from 'fs'
import * as esbuild from 'esbuild'
import { Plugin, PluginsExecutor } from './plugins-executor'
import path from 'path'

// TODO use the executor to find entries
export async function getEntries(
    pluginsExecutor: PluginsExecutor,
    config: Config,
) {
    if (!config.root) {
        throw new Error(`Cannot get entries without having root`)
    }
    if (config.entries) {
        for (let entry of config.entries) {
            if (config.platform === 'browser' && !entry.endsWith('.html')) {
                throw new Error(
                    `When targeting browser config.entries can only contain html files: ${entry}`,
                )
            }
        }
        return (
            await Promise.all(
                config.entries.map((x) =>
                    pluginsExecutor
                        .resolve({
                            path: x,
                            resolveDir: config.root,
                        })
                        .then((x) => x?.path || ''),
                ),
            )
        ).filter(Boolean)
    }

    // public folder logic is already in the html resolver plugin
    const index1 = await pluginsExecutor.resolve({
        path: 'index.html',
        resolveDir: config.root,
    })
    if (index1?.path) {
        return [index1.path]
    }

    throw new Error(
        `Cannot find entries, neither config.entries, index.html or public/index.html files are present\n${JSON.stringify(
            config,
            null,
            4,
        )}`,
    )
}

export type Platform = 'node' | 'browser'

export interface Config {
    server?: ServerConfig
    build?: BuildConfig
    profile?: boolean
    platform?: Platform
    root?: string
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
    forcePrebundle?: boolean
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
    let config: Config = {}
    if (configPath) {
        config = require(configPath)
    }
    if (!config.root) {
        config = { ...config, root: process.cwd() }
    }
    return config
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
