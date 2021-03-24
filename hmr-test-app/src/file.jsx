import React, { useImperativeHandle } from 'react'
import x from './file2'
import { y } from './imported-many-times'

export const staticVariable = { count: 0 }

export const Comp = () => {
    return (
        <div>
            {y}xxx{x}
        </div>
    )
}

// setInterval(() => {
//     console.log(staticVariable)
// }, 1000)
