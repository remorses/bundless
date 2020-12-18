import {text as text2} from "/text.ts?namespace=file";
console.log("Hello world!");
var node = document.createElement("h1");
var textNode = document.createTextNode(text2);
node.appendChild(textNode);
document.body.appendChild(node);
