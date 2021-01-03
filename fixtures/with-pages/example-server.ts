import Koa from 'koa'
import send from 'koa-send'
import { build, Config, PluginsExecutor } from '@bundless/cli'
import path from 'path'
import mime from 'mime-types'
import { Plugin as PagedPlugin } from '@bundless/plugin-react-paged'
import { importPathToFile } from '@bundless/cli/dist/utils'

const root = __dirname
const builtAssets = path.resolve(root, 'out')

async function prepare() {
    await build({
        config: {
            entries: ['index.html', 'about/index.html'], // TODO the server should compute the paths with a glob
            root,
            plugins: [PagedPlugin()],
        },
        outDir: builtAssets,
    })
}

const app = new Koa()

const prepared = prepare()

app.use(async (_, next) => {
    await prepared
    return next()
})

app.use(serveStatic({ root: builtAssets }))

const productionPluginsExecutor = new PluginsExecutor({
    root,
    // here the clientScriptSrc is different because it must be the one built by esbuild
    plugins: [PagedPlugin({ clientScriptSrc: '/index.js' })],
})

app.use(async (ctx, next) => {
    if (ctx.method !== 'GET') return next()

    const filePath = importPathToFile(root, ctx.path)
    const { contents, contentType } = await resolveHtmlWithPlugins(
        productionPluginsExecutor,
        {
            filePath,
            root,
        },
    )

    if (contents) {
        ctx.body = contents
        ctx.status = 200
        ctx.type = contentType
        return next()
    }
})

// the main plugin logic is run here
async function resolveHtmlWithPlugins(
    pluginsExecutor: PluginsExecutor,
    { root, filePath },
) {
    const resolved = await pluginsExecutor.resolve({
        importer: '',
        namespace: 'file',
        resolveDir: path.dirname(filePath),
        path: filePath,
    })

    if (!resolved || !resolved.path) {
        return {}
    }

    if (path.extname(resolved.path) !== '.html') {
        return
    }
    const loaded = await pluginsExecutor.load({
        namespace: 'file',
        path: resolved.path,
    })
    if (!loaded || !loaded.contents) {
        return {}
    }
    const transformed = await pluginsExecutor.transform({
        contents: String(loaded.contents),
        path: resolved.path,
        namespace: 'file',
    })
    if (!transformed) {
        return {}
    }

    return {
        contents: transformed.contents,
        contentType: String(mime.lookup(resolved.path)) || '*/*',
    }
}

function serveStatic({ root }) {
    return async function staticServer(ctx, next) {
        await next()

        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

        if (ctx.body != null || ctx.status !== 404) return

        try {
            await send(ctx, ctx.path, {
                index: 'index.html',
                hidden: true,
                root,
            })
        } catch (err) {
            if (err.status !== 404) {
                throw err
            }
        }
    }
}

app.listen(8080, () => console.log(`Listening at http://localhost:8080`))
