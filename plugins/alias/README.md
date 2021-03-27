## Example

```ts
// bundless.config.js
const { AliasPlugin } = require('@bundless/plugin-alias')

module.exports = {
    plugins: [
        AliasPlugin({
            entries: { react: 'preact/compat' },
        }),
    ],
}
```
