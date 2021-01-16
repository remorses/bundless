<div align='center'>
    <br/>
    <br/>
    <h3>bundless</h3>
    <p>Next gen dev server and bundler</p>
    <p>project under heavy development</p>
    <br/>
</div>

## What's the difference with traditional tools like Webpack?

-   Faster dev server times and faster build speed (thanks to [esbuild](https://esbuild.github.io))
-   Bundless serves native ES modules to the browser, removing the overhead of parsing each module before serving
-   Uses a superset of [esbuild plugin system](https://esbuild.github.io/plugins/)

## What's the difference with tools like vite?

Bundless is very similar to vite, both serve native es modules to the browser and build a bundles version for production.

Also both are based on a plugin system that can be shared between the dev server and the bundler.

Some differences are:

-   Bundless uses the esbuild plugin system instead of rollup
-   Bundless uses esbuild instead of rollup for the production bundle and the es module traversal for the pre bundling phase
-   Bundless prebundling and build phases are faster for the reasons above (but lacks on more advanced features )
-   Bundless still lacks some features like css modules (depends on [esbuild](https://github.com/evanw/esbuild/issues/20)) and more framework support (coming soon)
