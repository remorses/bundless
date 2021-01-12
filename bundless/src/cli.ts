#!/usr/bin/env node
require('source-map-support').install()
if (process.argv.includes('--debug')) {
    process.env.DEBUG_BUNDLESS = 'true'
}

import degit from 'degit'
import prompts from 'prompts'
import deepMerge from 'deepmerge'
import yargs, { CommandModule } from 'yargs'
import { build } from './build'
import { Config, loadConfig } from './config'
import { CONFIG_NAME, EXAMPLES_FOLDERS } from './constants'
import { serve } from './serve'
import { logger } from './logger'
import path from 'path'

const serveCommand: CommandModule = {
    command: ['serve', '*'],
    builder: (argv) => {
        argv.option('port', {
            alias: 'p',
            type: 'number',
            description: 'The port for the dev server',
        })
        argv.option('force', {
            alias: 'f',
            type: 'boolean',
            description:
                'Force prebundling even if dependencies did not change',
        })
        return argv
    },
    handler: async (argv: any) => {
        const loadedConfig = loadConfig(process.cwd(), argv.config)
        const configFromArgv: Config = {
            prebundle: { force: argv.force },
            server: {
                port: argv.port,
            },
            printStats: argv.stats,
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
            description: 'The output directory',
        })

        return argv
    },
    handler: async (argv: any) => {
        let config = loadConfig(process.cwd(), argv.config)
        const configFromArgv: Config = {
            build: {
                outDir: argv.outDir,
            },
            printStats: argv.stats,
        }
        config = deepMerge(config, configFromArgv)
        return await build({
            ...config,
        })
    },
}

const quickstartCommand: CommandModule = {
    command: ['quickstart <outDir>'],
    builder: (argv) => {
        argv.positional('outDir', { type: 'string' })
        return argv
    },
    handler: prettyPrintErrors(async (argv: any) => {
        const exampleDir = await prompts({
            type: 'select',
            name: 'value',
            message: 'What example do you want to use?',
            choices: EXAMPLES_FOLDERS.map(
                (message: string): prompts.Choice => ({
                    title: message,
                    value: message,
                }),
            ),
        })
        if (!exampleDir.value) {
            logger.log(`Nothing done`)
            return
        }
        logger.log(`Downloading ${exampleDir.value} example to ${argv.outDir}`)
        const emitter = degit(
            path.posix.join('remorses/bundless/examples', exampleDir.value),
            {
                verbose: true,
            },
        )

        emitter.on('info', (info) => {
            logger.debug(info.message)
        })

        await emitter.clone(argv.outDir)
        logger.log(`Downloaded example to ./${path.normalize(argv.outDir)}`)
    }),
}

yargs
    .locale('en')
    .option('config', {
        alias: 'c',
        type: 'string',
        default: CONFIG_NAME,
        description: `The config path to use`,
    })
    .option('debug', {
        type: 'boolean',
        description: `Enables debug logging`,
    })
    .option('stats', {
        type: 'boolean',
        description: 'Show profiling stats',
    })
    .command(serveCommand)
    .command(buildCommand)
    .command(quickstartCommand)
    .version()
    .help('help', 'h').argv

function prettyPrintErrors(fn) {
    return async (...args) => {
        try {
            return await fn(...args)
        } catch (e) {
            logger.error(e.message)
            logger.error(e.stack)
        }
    }
}
