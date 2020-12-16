import chalk from 'chalk'
const prefix = chalk.dim('[espack] ')

export const logger = {
    log(...x) {
        process.stderr.write(prefix + x.join(' ') + '\n')
    },
}
