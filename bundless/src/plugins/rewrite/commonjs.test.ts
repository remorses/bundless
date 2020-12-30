import { transformCjsImport } from './commonjs'

describe('rewrite commonjs imports', () => {
    const cases = [
        `import React from 'react'`,
        `import * as React from 'react'`,
        `import React, { useState } from 'react'`,
        `import { useState } from 'react'`,
        `import { useState, useEffect } from 'react'`,
        `import { useState as something } from 'react'`,
        `import { useState as something, useEffect } from 'react'`,
        `import { useState as something, useEffect as alias } from 'react'`,
        `import { default as Default } from 'react'`,
        `import { default as Default, useEffect } from 'react'`,
    ]
    for (let [i, testCase] of cases.entries()) {
        test(`${i} "${testCase}"`, () => {
            const res = transformCjsImport(testCase, 'react', 'react', 0)
            expect(res).toMatchSnapshot()
        })
    }
})
