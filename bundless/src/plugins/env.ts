import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import findUp from 'find-up'
import fs from 'fs-extra'
import path from 'path'
import { logger } from '../logger'
import { PluginHooks } from '../plugins-executor'

export function EnvPlugin({
    envFiles = [] as string[],
    env = {} as Record<string, string>,
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
            for (const k in env) {
                define[`process.env.${k}`] = JSON.stringify(env[k])
            }

            Object.assign(initialOptions.define, define)
        },
    }
}
