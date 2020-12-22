import image from './image.png'

console.log(image)

const node = document.createElement('div')
var img = document.createElement('img')
img.src = image
document.body.appendChild(node.appendChild(img))
