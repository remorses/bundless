// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
    transform: { '.(ts|tsx)': '@sucrase/jest-plugin' },
    testPathIgnorePatterns: ['/dist/', '/esm/', '/node_modules/'],
    testEnvironment: 'node',
    forceExit: true,
    bail: 1,
}

module.exports = config
