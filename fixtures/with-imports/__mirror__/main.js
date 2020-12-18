import { text } from '/text.js?namespace=file'

console.log('Hello world!!!!!')

var node = document.createElement('LI')
var textNode = document.createTextNode(text)
node.appendChild(textNode)
document.body.appendChild(node)
