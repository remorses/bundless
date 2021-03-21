import { text } from './file'
import './file.fakecss'
import fakejs from './file.fakejs'

const node = document.createElement('pre')
node.appendChild(document.createTextNode(text + ' ' + fakejs))
document.body.appendChild(node)

if (import.meta.hot) {
    import.meta.hot.accept()
}
