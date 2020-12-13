console.log('Hello world!')

var node = document.createElement('LI') // Create a <li> node
var textnode = document.createTextNode('works!') // Create a text node
node.appendChild(textnode) // Append the text to <li>
document.body.appendChild(node) // Append <li> to <ul> with id="myList"
