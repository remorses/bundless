import path from 'path'
import { fileToImportPath, importPathToFile } from './path'

const root = __dirname

describe('fileToImportPath posix', () => {
    const cases: { path: string; expected: string; onlyWin?: boolean }[] = [
        { path: '../cosa/index.ts', expected: '/__..__/cosa/index.ts' },
        {
            path: path.posix.resolve(root, '../cosa/index.ts'),
            expected: '/__..__/cosa/index.ts',
        },
        {
            path: `..${path.win32.sep}cosa${path.win32.sep}index.ts`,
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
                expect(importPathToFile(root, res1, path.posix)).toBe(
                    path.posix.resolve(root, testCase.path),
                )
            }
            const res2 = fileToImportPath(root, testCase.path, path.win32)
            expect(res2).toBe(testCase.expected)
            expect(importPathToFile(root, res2, path.win32)).toBe(
                path.win32.resolve(root, testCase.path),
            )
        })
    }
})
