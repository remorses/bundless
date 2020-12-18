
import('./text').then(({ text }) => {
    var node = document.createElement('LI')
    var textNode = document.createTextNode(text)
    node.appendChild(textNode)
    document.body.appendChild(node)
})
