import image from '/image.png?namespace=file'
import '/file.css.cssjs?namespace=file'

console.log(image)

const node = document.createElement('div')
var img = document.createElement('img')
img.src = image
document.body.appendChild(node.appendChild(img))

import('/dynamic-import.js?namespace=file').then(console.log)
