import json from './text.json'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(json.text)))
