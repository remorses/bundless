import '/_hmr_client.js?namespace=hmr-client';
import { text } from '/text.js?namespace=file'

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
