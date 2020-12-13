import text from '../outsider'

console.log(text)

var node = document.createElement('pre') 
var textnode = document.createTextNode(text) 
node.appendChild(textnode) 
document.body.appendChild(node) 
