import '/common.css.cssjs?namespace=file&t=0'
import { text } from '/b/text.js?namespace=file&t=0'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))
