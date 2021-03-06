import os from 'os'
import path from 'path'
import { fileToImportPath, importPathToFile } from './path'

const root = path.resolve(__dirname)

describe('fileToImportPath and importPathToFile', () => {
    const cases: {
        path: string
        expected: string
        onlyWin?: boolean
        onlyUnix?: true
    }[] = [
        { path: '../cosa/index.ts', expected: '/__..__/cosa/index.ts' },
        {
            path: '../cosa/folder/index.ts',
            expected: '/__..__/cosa/folder/index.ts',
        },
        {
            path: 'cosa/folder/../index.ts',
            expected: '/cosa/index.ts',
        },
        {
            path: 'cosa/folder/../../../../index.ts',
            expected: '/__..__/__..__/index.ts',
        },
        {
            path: path.posix.resolve(root, '../cosa/index.ts'),
            expected: '/__..__/cosa/index.ts',
            onlyUnix: true,
        },
        {
            path: path.win32.resolve(root, '..\\cosa\\index.ts'),
            expected: '/__..__/cosa/index.ts',
            onlyWin: true,
        },
        {
            path: `..\\cosa\\index.ts`,
            expected: '/__..__/cosa/index.ts',
            onlyWin: true,
        },
        {
            path: path.win32.resolve(root, '..\\cosa\\index.ts'),
            expected: '/__..__/cosa/index.ts',
            onlyWin: true,
        },
    ]
    for (let [i, testCase] of cases.entries()) {
        test(i + ' ' + testCase.path, () => {
            if (!testCase.onlyWin && os.platform() !== 'win32') {
                const res1 = fileToImportPath(root, testCase.path, path.posix)
                expect(res1).toBe(testCase.expected)
                expect(importPathToFile(root, res1, path.posix)).toBe(
                    path.posix.resolve(root, testCase.path),
                )
            }
            if (!testCase.onlyUnix) {
                const res2 = fileToImportPath(
                    root,
                    testCase.path.replace(/\//g, '\\'),
                    path.win32,
                )
                expect(res2).toBe(testCase.expected)
                expect(importPathToFile(root, res2, path.win32)).toBe(
                    path.win32.resolve(root, testCase.path),
                )
            }
        })
    }
})
