// @jsx jsx

const node = document.createElement('pre')
node.appendChild(document.createTextNode(process.env.SOME_VAR))
document.body.appendChild(node)

console.log(process.env.SOME_VAR)
