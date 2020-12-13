import slash from 'slash'

console.log('Hello world!')

const text = slash('.\\path\\to\\something')

var node = document.createElement('LI') // Create a <li> node
var textnode = document.createTextNode(text) // Create a text node
node.appendChild(textnode) // Append the text to <li>
document.body.appendChild(node) // Append <li> to <ul> with id="myList"
