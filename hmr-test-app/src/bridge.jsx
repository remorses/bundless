import React, { useState } from 'react'
import { Comp } from './file'
import './file.css'
import json from './file.json'
import css from './file.module.css'

export function App() {
    const [state, setState] = useState(0)
    return (
        <React.StrictMode>
            <Comp />
            <pre>{JSON.stringify({ json, css })}</pre>
            <br />
            <br />
            <br />
            <button
                style={{ fontSize: 40 }}
                onClick={() => setState((x) => x + 1)}
            >
                +1
            </button>
            <pre style={{ fontSize: 60 }}>{state}</pre>
        </React.StrictMode>
    )
}

console.log(new Error('i am here'))

// export const x = 9