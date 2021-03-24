import React, { useLayoutEffect, useState } from 'react'
import { Comp, staticVariable } from './file'
import './file.css'
import json from './file.json'
import css from './file.module.css'

export function App() {
    const [state, setState] = useState(0)
    useLayoutEffect(() => {
        staticVariable.count += 1
    }, [])
    return (
        <React.StrictMode>
            <Comp />
            <pre>{JSON.stringify({ json, css })}</pre>
            <pre>{JSON.stringify(staticVariable)}</pre>
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

console.log(new Error('i am here, line 27'))

// export const x = 9
