import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client'; import.meta.hot = __HMR__.createHotContext(import.meta.url); import { text } from '/file.js?namespace=file'
import fakejs from '/file.fakejs?namespace=file'

const node = document.createElement('pre')
node.appendChild(document.createTextNode(text + ' ' + fakejs))
document.body.appendChild(node)

if (import.meta.hot) {
    import.meta.hot.accept()
}
