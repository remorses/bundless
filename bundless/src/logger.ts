import chalk from 'chalk'
import ora, { Ora } from 'ora'

const defaultPrefix = '[bundless] '

const DEBUG = process.env.DEBUG
export class Logger {
    prefix: string = ''
    constructor({ prefix = defaultPrefix } = {}) {
        this.prefix = prefix
    }

    private print(x) {
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

    private spinner?: Ora

    spinStart(text: string) {
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
