import './file.css'

const node = document.createElement('pre')
node.appendChild(
    document.createTextNode('This has been made in 2020, what a shitty year'),
)
document.body.appendChild(node)


if (import.meta.hot) {
    import.meta.hot.accept()
}