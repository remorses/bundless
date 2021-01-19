import React, { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

export function Paragraph() {
    return (
        <div>
            <p>Ciao</p>
            <a href='/about'>/about with a</a>
            <br />
        </div>
    )
}
