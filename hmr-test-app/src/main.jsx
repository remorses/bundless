import React from 'react'
import { App } from './bridge'
import ReactDOM from 'react-dom'
import { y } from './imported-many-times'

ReactDOM.render(
    <>
        <App />
        <button
            onClick={() => {
                import(noop('/src/main.jsx?sdf'))
            }}
        >
            refetch
        </button>
        <br />
        <br />
        {y}
    </>,
    document.getElementById('root'),
)

if (import.meta.hot) {
    import.meta.hot.accept()
}

const noop = (x) => x
