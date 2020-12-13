<div align='center'>
    <br/>
    <br/>
    <img src='' width='320px'>
    <br/>
    <h3>espack</h3>
    <p>project under heavy development</p>
    <br/>
    <br/>
</div>

## Features:

-   can consume commonjs packages
-   prebundles dependencies in bundles
-   supports jsx, typescript, css out of the box
-   support for monorepos and complex node_modules structures

Still in progress

-   HMR
-   hmr plugins for react refresh
-   build command to bundle with esbuild
-   create-app templates
-   aliases support
-   css modules
-   css preprocessors
-   auto detect aliases from tsconfig.json
-   extract css to chunks and add them in html

Later:

-   Vue support
-   multi entry
-   SSR

todos:

-   loading file imported from js is different than loading paths to serve directly
-   resolve package only resolves js extensions, can i use it for everything? add a way to add resolvable extensions
-   should i apply onTransform on assets or only files loaded from js?
-   how can i understand the content type from the result of plugins onLoad? i can use the loader option, also, files imported from js are always js
-   how to separate css, json, ... from the esbuild default onLoad? just use the js, ts extensions in esbuild onLoad, use more specific extensions for css onLoad, json onLoad, ...
-   how can i do import rewrite in files that have non js extension? add the `loader` in the transform input, this way i know when content type is js
-   how can i run onTransforms in esbuild? onTransform calls are applied to onLoad results, this means that i will need to load all files (sad)
-   when should i resolve paths? do it in module rewrite phase, also add the prefixing /
-   how to interact with html? don't do it (for now, maybe later i can create an onEmit handler that can output new files and add these in html links)
-   what if a file does not exist but is virtual, how can loaders handle it? it should be already be handled by middleware, this way loaders won't load it
