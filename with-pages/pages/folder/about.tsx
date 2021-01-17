import React, { useEffect, useState } from 'react'

export default function Page() {
    const [state, setState] = useState('')
    useEffect(() => {
        setTimeout(() => {
            setState('Dynamic content!')
        }, 1000)
    }, [])
    return (
        <div>
            <p>About me:</p>
            <p>I Am Me</p>
            <p>who?</p>
            <p>...</p>
            <p>cool</p>
            <br />
            <p>{state}</p>
        </div>
    )
}
