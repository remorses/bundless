## Migration from create-react-app

-   Source code must not use `require` or `module.exports` but valid ES imports and exports
-   Use `jsx` instead of `js` extension for files that contain jsx
-   Remove ejs templates from index.html
-   Add your entrypoint in index.html with a script tag (for example `<script type='module' src='/src/index.jsx'>` if `src/index.jsx` is your entry)
-   Instead of using the package.json `homepage` option you should pass `basePath` to `bundless.config.js` in the `build.basePath` options
-   If using a workspace all your linked packages must expose valid ESM code (no `require` calls) (if this is not the case, add `prebundleWorkspacePackages` option)
-   Replace eventual webpack plugins with esbuild alternatives (notice that the most popular webpack plugins are built in in bundless so you probably don't need any additional plugins, see [features]() to see if there is something missing)
