import classNames from './file.module.css'
import { text } from './file'

console.log({ classNames })

const node = document.createElement('pre')
node.appendChild(document.createTextNode(text))
document.body.appendChild(node)

if (import.meta.hot) {
    import.meta.hot.accept()
}
