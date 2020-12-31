import React, { createElement } from '/web_modules/index.js?namespace=file'
import { useState } from '/web_modules/index.js?namespace=file'
import { text } from '/text.js?namespace=file'

console.log('Hello world!!!!!')

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(text)))

React.createElement('div')

function Comp() {
    const [] = useState()
    return createElement('div', {})
}

Comp

console.log(new Error('I should be on line 20'))
console.log({ ...new Error('I should be on line 20') })
