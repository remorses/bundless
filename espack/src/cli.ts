#!/usr/bin/env node
require('source-map-support').install();
import yargs, { CommandModule } from 'yargs'
import deepMerge from 'deepmerge'
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
        return argv
    },
    handler: async (argv) => {
        const config = deepMerge({}, { port: argv.port }) // TODO resolve and load config
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
