import chalk from 'chalk'
const prefix = chalk.gray('[espack]')

export const logger = {
    log(...x) {
        process.stderr.write(prefix, ...x, '\n')
    },
}
