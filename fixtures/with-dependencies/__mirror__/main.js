import slash from '/web_modules/index.js?namespace=file'

console.log('Hello world!')

const text = slash('.\\path\\to\\something')

var node = document.createElement('LI') 
var textnode = document.createTextNode(text) 
node.appendChild(textnode) 
document.body.appendChild(node) 
