#!/usr/bin/env node
require('source-map-support').install()
import yargs, { CommandModule } from 'yargs'
import deepMerge from 'deepmerge'
import { serve } from './serve'
import { Config, getEntries, loadConfig } from './config'
import { CONFIG_NAME } from './constants'
import { build } from './build'

const serveCommand: CommandModule = {
    command: ['serve', '*'],
    builder: (argv) => {
        argv.option('port', {
            alias: 'p',
            type: 'number',
            required: false,
            description: 'The port for the dev server',
        })

        return argv
    },
    handler: async (argv: any) => {
        const loadedConfig = loadConfig(process.cwd(), argv.config)
        let config: Config = deepMerge(loadedConfig, { port: argv.port }) // TODO resolve and load config
        if (!config.root) {
            config = { ...config, root: process.cwd() }
        }
        return serve(config)
    },
}

const buildCommand: CommandModule = {
    command: ['build'],
    builder: (argv) => {
        argv.option('outDir', {
            alias: 'o',
            type: 'string',
            required: false,
            description: 'The output directory',
        })

        return argv
    },
    handler: async (argv: any) => {
        let config = loadConfig(process.cwd(), argv.config)
        const root = config.root || process.cwd()
        if (!config.root) {
            config = { ...config, root }
        }
        return build({
            root,
            outDir: argv.outDir,
            ...config,
            entryPoints: getEntries(config),
        })
    },
}

yargs
    .locale('en')
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
    })
    .option('config', {
        alias: 'c',
        type: 'string',
        default: CONFIG_NAME,
        required: false,
        description: `The config path to use`,
    })
    .command(serveCommand)
    .command(buildCommand)
    .help('help', 'h').argv
