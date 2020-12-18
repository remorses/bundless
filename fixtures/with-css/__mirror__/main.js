import '/file.css?namespace=file'

const node = document.createElement('pre')
node.appendChild(
    document.createTextNode('This has been made in 2020, what a shitty year'),
)
document.body.appendChild(node)


if (import.meta.hot) {
    import.meta.hot.accept()
}import * as  __HMR__ from '/_hmr_client.js?namespace=hmr-client';
import.meta.hot = __HMR__.createHotContext(import.meta.url);
