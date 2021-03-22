import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client'; import.meta.hot = __HMR__.createHotContext(import.meta.url); import react_cjsImport0 from "/.bundless/web_modules/index-FGRWRRTD.js?namespace=file"; const React = react_cjsImport0 && react_cjsImport0.__esModule ? react_cjsImport0.default : react_cjsImport0; const createElement = react_cjsImport0["createElement"];
import react_cjsImport1 from "/.bundless/web_modules/index-FGRWRRTD.js?namespace=file"; const useState = react_cjsImport1["useState"];
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


// throw new Error('I should be on line 20')

if (import.meta.hot) {
    import.meta.hot.accept()
}
