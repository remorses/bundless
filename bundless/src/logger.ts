import chalk from 'chalk'
const prefix = '[bundless] '

function print(x) {
    process.stderr.write(chalk.dim(prefix) + x + '\n')
}

const DEBUG = process.env.DEBUG
export const logger = {
    log: (...x) => {
        print(x.join(' '))
    },
    warn(...x) {
        print(chalk.yellow(x.join(' ')))
    },
    debug: DEBUG
        ? (...x) => {
              // return
              process.stderr.write(chalk.dim(prefix + x.join(' ') + '\n'))
          }
        : () => {},
}
