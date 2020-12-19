import React from 'react'
import { App } from './bridge'
import ReactDOM from 'react-dom'
import { y } from './imported-many-times'

ReactDOM.render(
    <>
        <App />
        {y}
    </>,
    document.getElementById('root'),
)

if (import.meta.hot) {
    import.meta.hot.accept()
}
