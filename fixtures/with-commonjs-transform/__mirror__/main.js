import '/_hmr_client.js?namespace=hmr-client';
import react_cjsImport0 from "/web_modules/index.js?namespace=file";
const useState = react_cjsImport0["useState"];

console.log('useState', String(useState))

var node = document.createElement('pre') 
var textnode = document.createTextNode(String(useState)) 
node.appendChild(textnode) 
document.body.appendChild(node)
