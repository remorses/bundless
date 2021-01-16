import React, { createElement } from 'react'
import { useState } from 'react'
import { text } from './text'

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))

React.createElement('div')

function Comp() {
    const [] = useState()
    return createElement('div', {})
}

Comp


// throw new Error('I should be on line 20')

if (import.meta.hot) {
    import.meta.hot.accept()
}
