import '../common.css'
import { text } from './text'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
