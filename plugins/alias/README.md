## Example

```ts
// bundless.config.js
const { AliasPlugin } = require('@bundless/plugin-alias')

module.exports = {
    plugins: [
        AliasPlugin({
            entries: [{ find: 'react', replacement: 'preact/compat' }],
        }),
    ],
}
```
