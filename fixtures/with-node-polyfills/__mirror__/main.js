import path from '/.../../path?namespace=node-builtins&resolved=path'

console.log({ path })

const text = path.resolve('something')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
