## How to handle html?

To process html with esbuild i have to load it as js, to process html in the server i have to load it as normal html and let the user make virtual html files

I can make an HtmlIngestPlugin that does an `onTransform` on html files and transform html to js

I can make an HtmlLoader that resolves and loads html as normal html, this won't be used directly by esbuild without later transforming it, i will extend the loader type with an added `html` loader, that will cause esbuild to error in case i don't handle with an onTransform first

In the server html files will be handled via a custom middleware that will try to resolve and load html files, this will happen after the js resolution

This way i can replicate the history fallback api and replace send with resolve, load, transform

The server won't have the html ingest plugin, it will only be used in traversal, prebundle, build

The html loader instead will be always used

## Should this server be used in prod?

No. But you can reuse plugins via PluginsExecutor, you could also pass additional context to plugins, to let them know you are in "production"

I could make the dev server usable i prod, to reuse plugins, but this way i should completely change a lot of stuff, it's better to expose the pluginsExecutor and use it in your own server to resolve, load, transform and pass custom stuff, this way i can make something like nextjs

Inside the server you would still be able to call build to build stuff for node for example

The server could reuse plugins and middleware from the main server, to handle stuff like

To build instead it would use the build function with custom configs

```tsx
function ThisPlugin() {
    // onResolve to load virtual html files
    // onTransform to prerender the react app to html

}

const executor = new PluginsExecutor({ plugins: [ThisPlugin()] })

build({
    entries: ['/pages/**],
    plugins: [VirtualHtmlFilesForPages()]
    outdir: 'build'
})

app.use(serveStatic('build'))

app.get('*', async (req, res) => {
    const htmlPath = await executor.resolve(req.path)
    const html = await executor.load(req.path)
    const newHtml = await executor.transform(html)
    res.send(newHtml)
    res.status = 200
})
```

## Prebundle and commonjs stale cache

Weird cases that makes rewrite fail:

-   Rewrite starts, it uses cached web_modules bundleMap
-   Resolver finds non prebundled path, it generates new bundleMap with different paths
-   Previous rewrite used wrong paths
