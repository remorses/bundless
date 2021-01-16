import text from '/__..__/outsider.js?namespace=file'

console.log(text)

var node = document.createElement('pre') 
var textnode = document.createTextNode(text) 
node.appendChild(textnode) 
document.body.appendChild(node) 
