import dat from './file.dat'
import svg from './file.svg'

import('./x.DAC').then(console.log)
console.log({ dat })

const node = document.createElement('img')
node.setAttribute('src', svg)
document.body.appendChild(node)

export const text = dat
