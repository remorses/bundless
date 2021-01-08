#!/usr/bin/env node
require('source-map-support').install()
if (process.argv.includes('--debug')) {
    process.env.DEBUG = 'true'
}

import deepMerge from 'deepmerge'
import yargs, { CommandModule } from 'yargs'
import { build } from './build'
import { Config, loadConfig } from './config'
import { CONFIG_NAME } from './constants'
import { serve } from './serve'

const serveCommand: CommandModule = {
    command: ['serve', '*'],
    builder: (argv) => {
        argv.option('port', {
            alias: 'p',
            type: 'number',
            required: false,
            description: 'The port for the dev server',
        })
        argv.option('force', {
            alias: 'f',
            type: 'boolean',
            required: false,
            description:
                'Force prebundling even if dependencies did not change',
        })
        return argv
    },
    handler: async (argv: any) => {
        const loadedConfig = loadConfig(process.cwd(), argv.config)
        const configFromArgv: Config = {
            server: {
                port: argv.port,
                forcePrebundle: argv.force,
            },
            profile: argv.profile,
        }
        let config: Config = deepMerge(loadedConfig, configFromArgv)
        return await serve(config)
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
        argv.option('profile', {
            type: 'boolean',
            required: false,
            description: 'Show profiling stats',
        })

        return argv
    },
    handler: async (argv: any) => {
        let config = loadConfig(process.cwd(), argv.config)
        const configFromArgv: Config = {
            build: {
                outDir: argv.outDir,
            },
            profile: argv.profile,
        }
        config = deepMerge(config, configFromArgv)
        return await build({
            ...config,
        })
    },
}

yargs
    .locale('en')
    .option('config', {
        alias: 'c',
        type: 'string',
        default: CONFIG_NAME,
        required: false,
        description: `The config path to use`,
    })
    .option('debug', {
        type: 'boolean',
        description: `Enables debug logging`,
    })
    .command(serveCommand)
    .command(buildCommand)
    .version()
    .help('help', 'h').argv
