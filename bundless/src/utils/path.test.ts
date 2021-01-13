import path from 'path'
import { fileToImportPath } from './path'

const root = __dirname

describe('fileToImportPath posix', () => {
    const cases: { path: string; expected: string; onlyWin?: boolean }[] = [
        { path: '../cosa/index.ts', expected: '/__..__/cosa/index.ts' },
        {
            path: path.posix.resolve(root, '../cosa/index.ts'),
            expected: '/__..__/cosa/index.ts',
        },
        {
            path: '..\\cosa\\index.ts',
            expected: '/__..__/cosa/index.ts',
            onlyWin: true,
        },
        {
            path: path.win32.resolve(root, '../cosa/index.ts'),
            expected: '/__..__/cosa/index.ts',
            onlyWin: true,
        },
    ]
    for (let [i, testCase] of cases.entries()) {
        test(i + ' ' + testCase.path, () => {
            if (!testCase.onlyWin) {
                const res1 = fileToImportPath(root, testCase.path, path.posix)
                expect(res1).toBe(testCase.expected)
            }
            const res2 = fileToImportPath(root, testCase.path, path.win32)
            expect(res2).toBe(testCase.expected)
        })
    }
})
