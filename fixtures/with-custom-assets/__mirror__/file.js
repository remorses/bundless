import dat from '/file.dat?namespace=file'
import svg from '/file.svg?namespace=file'

import('/x.DAC?namespace=file').then(console.log)
console.log({ dat })

const node = document.createElement('img')
node.setAttribute('src', svg)
document.body.appendChild(node)

export const text = dat
