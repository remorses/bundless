import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client'; import.meta.hot = __HMR__.createHotContext(import.meta.url); import { text } from '/file.js?namespace=file&t=2b3340ca0'
import '/file.fakecss.cssjs?namespace=file&t=a395b3f50'
import fakejs from '/file.fakejs?namespace=file&t=fa60a7c50'

const node = document.createElement('pre')
node.appendChild(document.createTextNode(text + ' ' + fakejs))
document.body.appendChild(node)

if (import.meta.hot) {
    import.meta.hot.accept()
}
