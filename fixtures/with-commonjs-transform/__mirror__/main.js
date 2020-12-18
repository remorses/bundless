import $viteCjsImport0_react from "/web_modules/index.js?namespace=file";
const useState = $viteCjsImport0_react["useState"];

console.log('useState', String(useState))

var node = document.createElement('pre') 
var textnode = document.createTextNode(String(useState)) 
node.appendChild(textnode) 
document.body.appendChild(node)
