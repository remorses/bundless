import image from './image.png'
import './file.css'

console.log(image)

const node = document.createElement('div')
var img = document.createElement('img')
img.src = image
document.body.appendChild(node.appendChild(img))

import('./dynamic-import.js').then(console.log)
