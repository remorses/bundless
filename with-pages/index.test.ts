import fetch from 'node-fetch'
import url from 'url'

import { format } from 'prettier'

const pages = ['/', '/about', '/slugs/slug-name', '/slugs/all/something/else']
const PORT = '9090'

beforeAll(async () => {
    const { start } = require('./server')
    await start({ port: PORT })
})

describe('pages paths return html', () => {
    const baseUrl = `http://localhost:${PORT}`
    for (let page of pages) {
        test(page, async () => {
            const res = await fetch(new url.URL(page, baseUrl), {
                headers: { accept: 'text/html' },
            })
            let text = await res.text()
            text = format(text, { parser: 'html' })
            expect(text).toMatchSnapshot(page)
        })
    }
})
