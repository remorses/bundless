import { variable } from 'fixtures-with-many-dependencies'

const node = document.createElement('pre')
document.body.appendChild(node.appendChild(document.createTextNode(variable)))
