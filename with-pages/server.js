const { createServer } = require('@bundless/plugin-react-paged')
const { once } = require('events')

const isProduction = false

async function start({ port = 8080 }) {
    const app = await createServer({ isProduction, root: __dirname })
    const server = app.listen(port, () =>
        console.log(`Listening at http://localhost:${port}`),
    )
    await once(server, 'listening')
    return server
}

if (require.main === module) {
    start({})
}

exports.start = start
