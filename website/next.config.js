const path = require('path')
const compose = require('compose-function')
const withReactSvg = require('next-react-svg')
const withImages = require('next-images')

const transpile = require('next-transpile-modules')(['landing-blocks', 'dokz'])
const { withDokz } = require('dokz/dist/plugin')

const composed = compose(withDokz, transpile, withImages)

module.exports = composed({
    include: path.resolve(__dirname, 'public'),
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
})
