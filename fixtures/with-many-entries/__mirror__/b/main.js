import '/_hmr_client.js?namespace=hmr-client';
import '/common.css?namespace=file'
import { text } from '/b/text.js?namespace=file'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
