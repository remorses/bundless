<div align='center'>
    <br/>
    <br/>
    <h3>bundless</h3>
    <p>Next gen dev server and bundler</p>
    <p>this project was a Vite alternative with many improvements like plugins, monorepo support, etc, most of them were added back to Vite 2, use Vite instead</p>
    <br/>
</div>

# Features

-   10x faster than traditional bundlers
-   Error panel with sourcemap support
-   jsx, typescript out of the box
-   import assets, import css

### What's the difference with traditional tools like Webpack?

-   Faster dev server times and faster build speeds (thanks to [esbuild](https://esbuild.github.io))
-   Bundless serves native ES modules to the browser, removing the overhead of parsing each module before serving
-   Bundless uses a superset of [esbuild plugin system](https://esbuild.github.io/plugins/) to let users enrich its capabilities

### What's the difference with tools like vite?

Bundless is very similar to vite, both serve native es modules to the browser and build a bundled version for production.

Also both are based on a plugin system that can be shared between the dev server and the bundler.

Some differences are:

-   Bundless uses the esbuild plugin system instead of rollup
-   Bundless uses esbuild instead of rollup for the production bundle
-   Bundless still lacks some features like css modules (depends on [esbuild](https://github.com/evanw/esbuild/issues/20)) and more framework support (coming soon)
