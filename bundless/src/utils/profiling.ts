import chalk from 'chalk'
import { max, quantile } from 'simple-statistics'

const MS_IN_MINUTE = 60000
const MS_IN_SECOND = 1000

type Quantiles = [number, number, number] | null

interface StatsResult {
    quantiles: Quantiles
    max: number
    outliers: FolderStats[]
}

interface FolderStats {
    path: string
    timeConsume: number
}

interface AnsiChartConfig<T, U = keyof T> {
    path: U
    timeConsume: U
}
function bg(text: string, fn = 'cyan') {
    return chalk.bgBlack[fn](text)
}

function fg(text, time) {
    let modifier = chalk.bold
    if (time > 10000) {
        modifier = modifier.red
    } else if (time > 2000) {
        modifier = modifier.yellow
    } else {
        modifier = modifier.green
    }

    return modifier(text)
}

export function ansiChart(
    data: FolderStats[],
    options?: { limit: number },
): string {
    const highlights = stats(data)
    const maxWidth = 10
    const shortedData = data.sort(
        (a, b) => Number(b['timeConsume']) - Number(a['timeConsume']),
    )
    const limitedData =
        options && options.limit
            ? shortedData.slice(0, options.limit)
            : shortedData

    return limitedData
        .map((item) => {
            const label = item['path']
            const v = Number(item['timeConsume'])
            const barLength =
                Math.max(1, Math.round((v * maxWidth) / highlights.max)) || 0
            const padLength = 10 - barLength
            const barColor = highlights.outliers.find(
                ({ path }) => path === label,
            )
                ? chalk.yellowBright
                : chalk.greenBright
            return [
                '  ',
                barColor(new Array(barLength).fill('▇').join('')),
                new Array(padLength).fill(' ').join(''),
                '    ',
                `[${fg(humanizeDuration(v), v)}] - ${label}`,
            ].join('')
        })
        .join('\n')
}

function humanizeDuration(value: number) {
    const mins = Math.floor(value / MS_IN_MINUTE)
    const secondsRaw = (value - mins * MS_IN_MINUTE) / MS_IN_SECOND

    const secondsWhole = Math.floor(secondsRaw)
    const secondsRemainder = Math.min(secondsRaw - secondsWhole, 0.99)

    let seconds = String(secondsWhole)

    if (secondsRemainder) {
        seconds += String(
            secondsRemainder
                .toPrecision(3)
                .replace(/^0/u, '')
                .replace(/0+$/u, '')
                .replace(/^\.$/u, '')
                .padEnd(4, '0'),
        )
    }

    const tokens: string[] = []

    if (mins > 0) {
        tokens.push(`${mins} min${mins > 1 ? 's' : ''}`)
    }

    tokens.push(`${seconds} secs`)

    return tokens.join(' ')
}

/**
 * detect if value is an outlet value.
 *
 * if the value is over double inter quartile range
 * @param {number[]} quartiles
 * @param {number} value
 */
function outlier(quartiles: Quantiles, value: number) {
    if (!quartiles) {
        return 0
    }
    const interQuartileRange = quartiles[2] - quartiles[0]
    return value - quartiles[2] > interQuartileRange * 2
}

/**
 * generate stats from data
 * @param folderStats folder name and time consume
 * @returns quantiles, max and outliers from stats
 */
export function stats(folderStats: FolderStats[]): StatsResult {
    if (!folderStats.length) {
        return {
            quantiles: null,
            max: Infinity,
            outliers: [],
        }
    }

    const data = folderStats.map((v) => v.timeConsume)
    const quantiles: Quantiles = [
        quantile(data, 0.25),
        quantile(data, 0.5),
        quantile(data, 0.75),
    ]

    return {
        quantiles,
        max: max(data),
        outliers: folderStats.filter((d) => outlier(quantiles, d.timeConsume)),
    }
}

export function humanizeStats(stats: { [key: string]: StatsResult }): string {
    const result: string[] = []
    for (const key in stats) {
        const { outliers } = stats[key]
        if (outliers.length) {
            result.push(
                `Slowest ${key} \n\t${outliers
                    .sort((a, b) => b.timeConsume - a.timeConsume)
                    .slice(0, 5)
                    .map(
                        (o) =>
                            `${fg(
                                humanizeDuration(o.timeConsume),
                                o.timeConsume,
                            )} \t ${bg(o.path, 'whiteBright')}`,
                    )
                    .join(',\n\t')}`,
            )
        }
    }

    return result.join('\n\n')
}
