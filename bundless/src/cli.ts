#!/usr/bin/env node
require('source-map-support').install()
import yargs, { CommandModule } from 'yargs'
import deepMerge from 'deepmerge'
import { serve } from './serve'
import { Config, loadConfig } from './config'
import { CONFIG_NAME } from './constants'

const serveCommand: CommandModule = {
    command: ['serve', '*'],
    builder: (argv) => {
        argv.option('port', {
            alias: 'p',
            type: 'number',
            required: false,
            description: 'The port for the dev server',
        })
        argv.option('config', {
            alias: 'c',
            type: 'string',
            default: CONFIG_NAME,
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

yargs
    .locale('en')
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
    })
    .option('filter', {
        alias: 'f',
        type: 'string',
        description: 'Only build experiments inside the specified path',
        array: true,
    })
    .command(serveCommand)
    .help('help', 'h').argv
