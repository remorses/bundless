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
-   supports importing jsx, typescript, css out of the box
-   support for monorepos and complex node_modules structures

Still in progress

-   HMR
-   hmr plugin for react refresh
-   build command to bundle with esbuild
-   create-app templates
-   aliases support
-   css modules
-   css preprocessors
-   auto detect aliases from tsconfig.json
-   extract css to chunks and add them in html

Later:

-   multi entry
-   SSR
-   Vue support

Plugins to implement

-   plugin-react-refresh, react hmr support
-   plugin-babel, use babel config to transpile stuff
-   tsconfig paths support
-   nextjs like routing
-   vue
-   svelte
-   prefresh

## todo:

-   // TODO esbuild only supports returning js code in onLoad plugins, how to apply transform on other assets like html? i could pass none loader on these files? instead of using only load i could use onEmit to get contents, this way i can get any type of asset and understand content type from extension
-   // TODO how to apply onTransform to onLoad when building? esbuild does not support onTransform, i need to convert onTransform to onLoad calls, i can do this converting the plugin executor to a monolith plugin that runs onTransform after onLoad, or run all the onTransform after every onLoad maintaining plugins separate but wrapped in closures
-   // TODO how do i get content type from plugins?, i can use extension from onEmit results
-   // TODO how to decide on what files apply plugins? i can try resolve the file, if no resolver is able to handle the extension, the file is considered asset, in case it can be resolved but shouldn't be converted to js (like css in `<link>`)? i can check if the content type is */* to see if file was imported from js
-   // TODO esbuild build plugins will use onEmit to emit non js css, on dev it should instead return css, how to split these 2 logics?
-   // TODO include namespaces in imports, this way i can trigger the onLoad for virtual files (like the hmr client...), use the namespace query to recognize files imported from js
<!--
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
-   what if a file does not exist but is virtual, how can loaders handle it? it should be already be handled by middleware, this way loaders won't load it -->
