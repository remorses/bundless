import React from 'react'
import x from './file2'
import { y } from './imported-many-times'

export const Comp = () => {
    return (
        <div>
            {y}xxxx{x}
        </div>
    )
}
