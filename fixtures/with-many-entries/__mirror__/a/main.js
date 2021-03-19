import '/a/main.css.cssjs?namespace=file'
import '/common.css.cssjs?namespace=file'

const text = 'A'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
