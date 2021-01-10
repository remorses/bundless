const { createServer } = require('@bundless/plugin-react-paged')

console.log({ __dirname })

createServer({ isProduction: true, root: __dirname }).then((app) =>
    app.listen(8080, () => console.log(`Listening at http://localhost:8080`)),
)
