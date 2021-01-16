import slash_cjsImport0 from "/web_modules/index.js?namespace=file"; const slash = slash_cjsImport0 && slash_cjsImport0.__esModule ? slash_cjsImport0.default : slash_cjsImport0;

console.log('Hello world!')

const text = slash('.\\path\\to\\something')

var node = document.createElement('LI') 
var textnode = document.createTextNode(text) 
node.appendChild(textnode) 
document.body.appendChild(node) 
