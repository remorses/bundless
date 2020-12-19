import slash from '/web_modules/node_modules/slash/index.js?namespace=file'
import React from '/web_modules/node_modules/react/index.js?namespace=file'
import { useState } from '/web_modules/fixtures/with-many-dependencies/node_modules/preact/dist/preact.js?namespace=file'
import ReactDom from '/web_modules/node_modules/react-dom/index.js?namespace=file'

console.log('Hello world!')
console.log(slash)
console.log(React.useState)
console.log(useState)
console.log(ReactDom.render)

export const variable = 10
