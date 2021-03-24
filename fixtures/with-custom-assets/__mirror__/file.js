import dat from '/file.dat?namespace=file&t=4ae394500'
import svg from '/file.svg?namespace=file&t=a2ec20aa0'

import('/x.DAC?namespace=file&t=10f764680').then(console.log)
console.log({ dat })

const node = document.createElement('img')
node.setAttribute('src', svg)
document.body.appendChild(node)

export const text = dat
