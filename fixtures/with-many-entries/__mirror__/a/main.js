import '/_hmr_client.js?namespace=hmr-client';
import '/a/main.css?namespace=file'
import '/common.css?namespace=file'

const text = 'A'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
