import react_cjsImport0 from "/web_modules/index.js?namespace=file";
const React = react_cjsImport0 && react_cjsImport0.__esModule ? react_cjsImport0.default : react_cjsImport0;
const createElement = react_cjsImport0["createElement"];
import react_cjsImport1 from "/web_modules/index.js?namespace=file";
const useState = react_cjsImport1["useState"];
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
