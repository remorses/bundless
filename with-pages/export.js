const { staticExport } = require('@bundless/plugin-react-paged')
const { once } = require('events')

async function start({}) {
    await staticExport({ root: __dirname })
}

if (require.main === module) {
    start({})
}

exports.start = start
