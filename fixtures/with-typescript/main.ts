import { text } from './text'

console.log('Hello world!')

var node: any = document.createElement('h1')
var textNode = document.createTextNode(text)
node.appendChild(textNode)
document.body.appendChild(node)
