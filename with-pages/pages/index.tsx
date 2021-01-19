import React, { useEffect, useState } from 'react'
import rpcFunction from '../rpc/example'
import { Link } from 'react-router-dom'

export default function Page() {
    const [text, setText] = useState('')
    useEffect(() => {
        rpcFunction({ echo: 'hello!' }).then((res) => {
            setText(res.echo)
        })
    }, [])

    return (
        <div>
            <p>Ciao</p>
            <p>{text}</p>
            <a href='/about'>/about with a</a>
            <br />
            <Link to='/dynamic-import'>/dynamic-import</Link>
            <br />
            <Link to='/about'>/about with Link</Link>
            <p>hello</p>
        </div>
    )
}
