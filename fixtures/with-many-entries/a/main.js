import './main.css'
import '../common.css'

const text = 'A'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
