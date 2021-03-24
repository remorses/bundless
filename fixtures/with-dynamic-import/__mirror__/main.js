
import('/text.js?namespace=file&t=a5d559580').then(({ text }) => {
    var node = document.createElement('LI')
    var textNode = document.createTextNode(text)
    node.appendChild(textNode)
    document.body.appendChild(node)
})
