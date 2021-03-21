// @jsx jsx
import { text } from '@virtual'
import React from 'react'

const node = document.createElement('pre')
node.appendChild(document.createTextNode(text))
document.body.appendChild(node)

console.log(React.cloneElement)
