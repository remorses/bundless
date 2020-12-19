import React from 'react'
import { Comp } from './file'
import './file.css'
import json from './file.json'
import css from './file.module.css'

export function App() {
    return (
        <React.StrictMode>
            <Comp />
            <pre>{JSON.stringify({ json, css })}</pre>
        </React.StrictMode>
    )
}
