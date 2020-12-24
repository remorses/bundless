import '/a/main.css?namespace=file'

const text = 'A'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
