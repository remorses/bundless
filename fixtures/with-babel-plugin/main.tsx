import ms from 'ms.macro'
import React from 'react'
import dom from 'react-dom'

const ONE_DAY = ms('1 day')
const TWO_DAYS = ms('2 days')

console.log(TWO_DAYS)

// src/Heading/Heading.ts
import styled from 'styled-components/macro'

const Heading = styled.h1`
    font-size: 2rem;
    color: red;
`

dom.render(<Heading>ciao</Heading>, document.getElementById('main'))
