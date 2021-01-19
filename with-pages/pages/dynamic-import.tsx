import loadable from '@loadable/component'
import React from 'react'

const C = loadable(() => import('../components').then(x => x.Paragraph))

export default function Page() {

    return (
        <div>
            <C/>      
        </div>
    )
}
