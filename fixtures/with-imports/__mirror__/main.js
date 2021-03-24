import { text } from '/text.js?namespace=file&t=0'

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
