import chalk from 'chalk'
import ora, { Ora } from 'ora'

const defaultPrefix = '[bundless] '

const DEBUG = process.env.DEBUG_BUNDLESS
export class Logger {
    prefix: string = ''
    silent: boolean
    constructor({ prefix = defaultPrefix, silent = false } = {}) {
        this.prefix = prefix
        this.silent = silent
    }

    private print(x) {
        if (this.silent) {
            return
        }
        if (this.spinner) {
            this.spinner.info(x)
        } else {
            process.stderr.write(chalk.dim(this.prefix) + x + '\n')
        }
    }
    log(...x) {
        this.print(x.join(' '))
    }
    warn(...x) {
        this.print(chalk.yellow(x.join(' ')))
    }
    error(...x) {
        this.print(chalk.red(x.join(' ')))
    }

    private spinner?: Ora

    spinStart(text: string) {
        if (this.silent) {
            return
        }
        this.spinner = ora(text).start()
    }
    spinSucceed(text: string) {
        if (this.spinner) {
            this.spinner.succeed(text)
        }
        this.spinner = undefined
    }
    spinFail(text: string) {
        if (this.spinner) {
            this.spinner.fail(chalk.red(text))
        }
        this.spinner = undefined
    }

    debug = DEBUG
        ? (...x) => {
              if (this.spinner) {
                  this.spinner.info(x.join(' ') + '\n')
              } else {
                  process.stderr.write(
                      chalk.dim(this.prefix + x.join(' ') + '\n'),
                  )
              }
          }
        : () => {}
}

export const logger = new Logger()
