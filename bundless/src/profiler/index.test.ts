import { ansiChart, humanizeStats, stats } from './'

test('ansiChart', () => {
    const res = ansiChart(data, { limit: 4 })
    console.log(res)
})
test('humanizeStats', () => {
    const res = humanizeStats({ context: stats(data) })
    console.log(res)
})

const data = [
    { path: 'a', timeConsume: 100 },
    { path: 'b', timeConsume: 1000 },
    { path: 'c', timeConsume: 1000 },
]
