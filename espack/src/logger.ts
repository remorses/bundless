import chalk from 'chalk'
const prefix = '[espack] '

export const logger = {
    log(...x) {
        process.stderr.write(chalk.dim(prefix) + x.join(' ') + '\n')
    },
    debug(...x) {
        process.stderr.write(chalk.dim(prefix + x.join(' ') + '\n'))
    },
}
