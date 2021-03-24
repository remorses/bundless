import json from '/text.json?namespace=file&t=a451f0320'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(json.text)))
