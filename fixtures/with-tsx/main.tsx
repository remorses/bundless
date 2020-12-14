// @jsx jsx
import { text } from './text'

function jsx(t, p, children) {
    var node = document.createElement(t)
    var textNode = document.createTextNode(children || p.children)
    node.appendChild(textNode)
    document.body.appendChild(node)
}


let x = <div>{text}</div>
