import React from 'react'
import { Link } from 'react-router-dom'

export default function Page() {
    return (
        <div>
            <p>Ciao</p>
            <a href='/about'>/about with a</a>
            <br/>
            <Link to='/about'>/about with Link</Link>
        </div>
    )
}
