
import('/text.js?namespace=file&t=0').then(({ text }) => {
    var node = document.createElement('LI')
    var textNode = document.createTextNode(text)
    node.appendChild(textNode)
    document.body.appendChild(node)
})
