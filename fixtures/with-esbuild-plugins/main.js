import schema from './file.gql'
import { text } from './file.fake'

const node = document.createElement('pre')
node.appendChild(document.createTextNode(schema))
node.appendChild(document.createTextNode('\n' + text))
document.body.appendChild(node)



if (import.meta.hot) {
    import.meta.hot.accept()
    import.meta.hot.dispose(() => {
        document.body.removeChild(node)
    })
}
