import '/_hmr_client.js?namespace=hmr-client';
import path from '/path?namespace=node-builtins'

console.log({ path })

const text = path.resolve('something')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
