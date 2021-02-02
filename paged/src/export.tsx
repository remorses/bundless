import { build, logger, PluginsExecutor } from '@bundless/cli'
import { osAgnosticPath } from '@bundless/cli/dist/utils'
import { batchedPromiseAll } from 'batched-promise-all'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { generatePath, StaticRouter } from 'react-router-dom'
import slash from 'slash'
import { CLIENT_ENTRY, ROUTES_ENTRY } from './constants'
import { Plugin } from './plugin'
import {
    getPagesRoutes,
    isDynamicRoute,
    relativePathToPublicPath,
} from './routes'
import { MainHtml, tryRequire } from './server'

export async function exportPage({
    ssrOutputPath,
    pluginsExecutor,
    clientScriptSrc,
    url,
}) {
    const { App } = tryRequire(ssrOutputPath)
    const context = { url }
    const prerenderedHtml = renderToString(
        <App Router={StaticRouter} context={context} />,
    )
    const html = renderToStaticMarkup(
        <MainHtml {...{ context, clientScriptSrc, prerenderedHtml }} />,
    )

    let fullHtml = `<!DOCTYPE html>\n${html}`
    // use plugins executor to process html and inject react refresh stuff ....
    if (pluginsExecutor) {
        const transformResult = await pluginsExecutor.transform({
            contents: fullHtml,
            path: 'index.html',
            loader: 'default'
        })

        fullHtml = transformResult.contents || ''
    }
    return fullHtml
}

export async function staticExport({
    root,
    ssrOutDir = 'ssr_out',
    clientOutDir = 'client_out',
}) {
    const pagesDir = path.resolve(root, 'pages')
    const routes = await getPagesRoutes({ pagesDir })
    const ssrEntry = path.resolve(root, ROUTES_ENTRY)
    const { bundleMap: ssrBundleMap } = await build({
        root,
        plugins: [Plugin()],
        platform: 'node',
        entries: [ssrEntry], // TODO ...routes.map((x) => x.absolute)
        build: {
            outDir: ssrOutDir,
            minify: false,
        },
    })

    const pluginsExecutor = new PluginsExecutor({
        ctx: { isBuild: true, config: { root }, root },
        plugins: [Plugin()],
    })

    let ssrOutputPath = ssrBundleMap[osAgnosticPath(ssrEntry, root)]
    if (!ssrOutputPath) {
        throw new Error(
            `Could not find ssr output for '${ssrEntry}', ${JSON.stringify(
                Object.keys(ssrBundleMap),
            )}`,
        )
    }
    ssrOutputPath = path.resolve(root, ssrOutputPath)

    const urls: string[] = flatten(
        await batchedPromiseAll(
            routes,
            async (route) => {
                if (isDynamicRoute(route)) {
                    const { getStaticPaths } = tryRequire(ssrOutputPath)
                    if (!getStaticPaths || !getStaticPaths[route.path]) {
                        return []
                    }
                    const getStaticPathsFn = getStaticPaths[route.path]
                    const paths = await getStaticPathsFn()
                    if (!paths) {
                        return []
                    }
                    return paths.paths.map((p) => {
                        const generated = generatePath(
                            route.path,
                            p.params || {},
                        )
                        return generated
                    })
                }
                return [relativePathToPublicPath(route.relative)]
            },
            os.cpus().length,
        ),
    )
    const { bundleMap: clientBundleMap } = await build({
        root,
        build: {
            outDir: clientOutDir,
            minify: false,
        },
        define: {
            'process.browser': 'false',
        },
        entries: [CLIENT_ENTRY],
        plugins: [Plugin()],
    })
    await batchedPromiseAll(
        urls,
        async (url: string) => {
            const html = await exportPage({
                clientScriptSrc: `/${slash(
                    path.relative(
                        clientOutDir,
                        path.resolve(root, clientBundleMap[CLIENT_ENTRY]),
                    ),
                )}`,
                ssrOutputPath,
                pluginsExecutor,
                url,
            })
            const outputHtmlPath = path.resolve(
                clientOutDir,
                (url.slice(1) || 'index') + '.html', // TODO better file creation based on public path
            )
            logger.log(`writing html page to ${outputHtmlPath}`)
            await fs.createFile(outputHtmlPath)
            await fs.writeFile(outputHtmlPath, html)
        },
        os.cpus().length,
    )
}

export function flatten<T>(arr: T[][]): T[] {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(
            Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten,
        )
    }, [])
}
