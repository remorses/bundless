import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client'; import.meta.hot = __HMR__.createHotContext(import.meta.url); import schema from '/file.gql?namespace=file&t=0'
import { text } from '/fake.js?namespace=file&t=0'

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
