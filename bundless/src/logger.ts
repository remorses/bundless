import chalk from 'chalk'
const prefix = '[bundless] '

export const logger = {
    log(...x) {
        process.stderr.write(chalk.dim(prefix) + x.join(' ') + '\n')
    },
    debug(...x) {
        return
        process.stderr.write(chalk.dim(prefix + x.join(' ') + '\n'))
    },
}
