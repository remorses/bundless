import { NodeResolvePlugin } from '@esbuild-plugins/all'
import { transform, Plugin } from 'esbuild'
import { PluginHooks } from '../plugins-executor'
import { readFile } from '../utils'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import path from 'path'
import findUp from 'find-up'
import dotenvExpand from 'dotenv-expand'
import { logger } from '../logger'

export function EnvPlugin({
    envFiles = [] as string[],
    findUp: isFindUp = false,
} = {}) {
    return {
        name: 'env',
        setup: ({ initialOptions, ctx: { root } }: PluginHooks) => {
            let define = {}
            for (let _envFile of envFiles) {
                let envFile
                if (fs.existsSync(path.resolve(root, _envFile))) {
                    envFile = path.resolve(root, _envFile)
                } else if (isFindUp) {
                    envFile = findUp.sync(_envFile, { cwd: root }) || ''
                }
                if (!envFile) {
                    logger.warn(`Cannot find env file '${_envFile}'`)
                    continue
                }
                const data = fs.readFileSync(envFile).toString()
                const parsed = dotenv.parse(data, {
                    debug: !!process.env.DEBUG || undefined,
                })

                // let environment variables use each other
                dotenvExpand({
                    parsed,
                    // prevent process.env mutation
                    ignoreProcessEnv: true,
                } as any)

                for (const k in parsed) {
                    define[`process.env.${k}`] = JSON.stringify(parsed[k])
                }
            }

            Object.assign(initialOptions.define, define)
        },
    }
}
