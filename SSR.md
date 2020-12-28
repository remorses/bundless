SSR in dev

-   build the entry for nodejs target
-   using an index.html that imports the client entry that calls React hydrate
-   use renderToString in html onTransform, requiring the App component from the built file
-   bundless will transform imports of the client entry to make everything work on client side

in prod

-   build files as static files, using an index.html as entry that imports the client js file that calls hydrate
-   build files for SSR, these will be used in the server middleware
-   server middleware does onTransform on the built index.html adding prerendered html
-   the html already referenced the client entry so hydration will happen correctly

SSG

-   do renderToString in onTransform, this will output html pre rendered
-   renderToString needs to require the user files from nodejs, this means i need to call buildForSSR or pass --require first
-   in the client entry use hydrate

changes

-   add a buildSSR that outputs code for nodejs, does not support html entrypoints
-   expose the output files as result of build, to use them in custom server
-   maybe make a prod mode for the server, which serves files from the build directory, applying onHtml transforms?

problems

-   onTransform should not be applied to the index.html during build, it should be done in the server part or the initial index.html after build will already contain the populated html
-   ssr in prod must be done wrapping the build and ssrBuild functions, changing the html in the server part, in dev instead it does a normal onTransform on the html

as an alternative to buildForSSR i can make a script to pass to node --require that compile scripts using pluginExecutor .transform()

image optimization

-   to do image optimization i need to know the width and height of the images, this can be done using a custom component that knows the image src, the width and height
-   a plugin can pattern match for this component calls and replace the src attr with another optimized one
