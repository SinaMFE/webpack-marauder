'use strict'

const config = require('../../config')
const { nodeModulesRegExp } = require('../../libs/utils')
const paths = config.paths
const maraConf = require(paths.marauder)

function babelExternalMoudles(esm) {
  if (!(esm && esm.length)) return nodeModulesRegExp(config.esm)

  // 当 esm 为 all 时，编译 node_modules 下所有模块
  if (esm === 'all') esm = ''

  return nodeModulesRegExp([].concat(config.esm, esm))
}

module.exports = isProd => ({
  test: /\.(js|jsx|mjs)$/,
  include: [paths.src, paths.test].concat(babelExternalMoudles(maraConf.esm)),
  loader: 'babel-loader',
  options: {
    babelrc: false,
    presets: ['babel-preset-react-app'],
    plugins: ['transform-decorators-legacy'],
    compact: isProd,
    // `babel-loader` 特性
    // 在 ./node_modules/.cache/babel-loader/ 中缓存执行结果
    // 提升性能
    cacheDirectory: !isProd,
    highlightCode: true
  }
})
