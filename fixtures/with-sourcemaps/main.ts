import React, { createElement } from 'react'
import { useState } from 'react'
import './js.js'
import { text } from './text'
import so from 'source-map-support'
so.getErrorSource

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))

React.createElement('div')

function Comp() {
    const [] = useState()
    return createElement('div', {})
}

Comp

console.log(new Error('I should be on line 22'))

throw new Error('I should be on line 24')


if (import.meta.hot) {
    import.meta.hot.accept()
}
