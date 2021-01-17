import React, { useEffect, useState } from 'react'

export default function Page() {
    return (
        <div>
            <p>Slug:</p>
        </div>
    )
}

export function getStaticPaths() {
    return {
        paths: [{ params: { slug: 'hello1' } }, { params: { slug: 'hello2' } }],
    }
}
