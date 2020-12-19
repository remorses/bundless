import json from '/text.json?namespace=file'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(json.text)))
