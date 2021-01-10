const { createServer } = require('@bundless/plugin-react-paged')

console.log({ __dirname })

const isProduction = false

createServer({ isProduction, root: __dirname }).then((app) =>
    app.listen(8080, () => console.log(`Listening at http://localhost:8080`)),
)
