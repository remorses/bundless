## Why another development server and bundler?

I was really frustrated by the slowness of current develoment bundlers and server, bundless tries to make the fastest possible development experience possible

It's using native ES modules in development and esbuild to build for production

It's simple to setup and already has support for the most used technologies like

-   typescript
-   jsx
-   css modules

Its esm HMR implementation is simple and easy to build upon

## What's the difference from snowpack?

Bundless has been built after reading the codebase of Snowpack, Vite and WMR, i am really thankful for the solutions found by these tools

Bundless can be seen as a rewrite of these tools to solve some problems

It's using a prebundling phase like in Snowpack, but it's using esbuild instead of rollup to improve speed

It's using a plugin system like in WMR, but it uses the esbuild plugin interface instead of Rollup

Bundless uses esbuild to traverse the import graph to find dependencies to prebundle, Snowpack instead search for all js files in root folder and uses `es-module-lexer` and a regex to extract import statements from non lexable files (like jsx, typescript, ...etc)

Like in vite and snowpack and Vite, i am using the esm HMR specification to support HMR, bundless implementation also solves some common bugs like [this](https://github.com/preactjs/wmr/issues/257#issuecomment-747296481)

Bundless has better support for monorepos compared to snowpack and vite 1, Snowpack for example does not support HMR for workspace packages and reload on every change in any linked package, vite 1 instead [fails to resolve packages that are not reachable from its root(https://github.com/vitejs/vite/issues/1002)

Another difference with snowpack and vite is multiple entries support, with bundless you can generate separate bundles per entry, this decreases bundle size per entry and allows you to also code split imported css

## What's the role of esbuild in bundless?

Esbuild is used to bundles js files for production,

In development it is used to transform jsx and typescript files,

Esbuild is also used in the prebundling phase:
when a not prebundled node module is found esbuild is used to traverse the import graph, the metafile is then analyzed to find resolved files that have a path including a node_modules folder, these paths are then bundled by esbuild to be transformed in valid ESM code and served from the web_modules folder

## Why prebundling?

Prebundling consists in bundling dependencies packages in files in the web_modules directory, this is to

-   make packages that use commonjs work in the browser
-   decrease the network requests made by the browser to fetch modules

But why bundless bundles all the dependencies and not ony the commonjs ones? This is to prevent issues with duplicate modules instances

## What's the shape of a bundless plugin?

bundless plugins are a superset of esbuild plugins, all esbuild plugins can be used as bundless plugins

Bundless adds some new hooks:

-   onTransform, used to transform code
-   onClose, called when the server is closing

It also passes some new variables in the build context:

-   `graph` is the HMR graph
-   `config` is the bundless config
-

Bundless has 2 main functions:

-   Dev server
-   Bundler

The dev server is a koa server that serves user modules in a way that makes them consumable by the browser, running them trough a plugins pipeline

Bundless plugins are a super set of esbuild plugins, they allow to load, resolve and transform modules

The core plugins are for example

-   rewrite: rewrite imports to be public paths the browser can resolve
-   resolves node modules to web modules

## Why use a new plugin system?

I am using a superset of esbuild plugins to be able to share logic between the build and dev steps

This way i can also reuse esbuild plugins
