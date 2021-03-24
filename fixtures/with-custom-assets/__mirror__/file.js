import dat from '/file.dat?namespace=file&t=0'
import svg from '/file.svg?namespace=file&t=0'

import('/x.DAC?namespace=file&t=0').then(console.log)
console.log({ dat })

const node = document.createElement('img')
node.setAttribute('src', svg)
document.body.appendChild(node)

export const text = dat
