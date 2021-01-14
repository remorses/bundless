import '/_hmr_client.js?namespace=hmr-client';
import image from '/image.png?namespace=file'
import '/file.css?namespace=file'

console.log(image)

const node = document.createElement('div')
var img = document.createElement('img')
img.src = image
document.body.appendChild(node.appendChild(img))

import('/dynamic-import.js?namespace=file').then(console.log)
