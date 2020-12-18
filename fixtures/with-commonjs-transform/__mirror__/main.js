import { useState } from '/web_modules/index.js?namespace=file'

console.log('useState', String(useState))

var node = document.createElement('pre') 
var textnode = document.createTextNode(String(useState)) 
node.appendChild(textnode) 
document.body.appendChild(node)
