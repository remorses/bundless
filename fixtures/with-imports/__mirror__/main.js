import { text } from '/text.js?namespace=file&t=5c15a55d0'

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
