import image from '/image.png?namespace=file&t=0'
import '/file.css.cssjs?namespace=file&t=0'

console.log(image)

const node = document.createElement('div')
var img = document.createElement('img')
img.src = image
document.body.appendChild(node.appendChild(img))

import('/dynamic-import.js?namespace=file&t=0').then(console.log)
