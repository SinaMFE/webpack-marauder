'use strict'

const path = require('path')
const config = require('../../config')
const paths = config.paths
const maraConf = require(paths.marauder)
const inlineJson = require.resolve('../../libs/babelInlineJson')

const externalMoudles = [paths.src, paths.test].concat(
  babelExternalMoudles(maraConf.esm)
)

function nodeModulesRegExp(...args) {
  // path.sep 指定平台特定的分隔符
  // Windows: \   POSIX: /
  // 参考：http://nodejs.cn/api/path.html#path_path_sep
  return args
    .reduce((res, item) => res.concat(item), [])
    .map(mod => new RegExp(`node_modules\\${path.sep}${mod}?`))
}

function babelExternalMoudles(esm) {
  if (!(esm && esm.length)) return nodeModulesRegExp(config.esm)

  // 当 esm 为 all 时，编译 node_modules 下所有模块
  if (esm === 'all') esm = ''

  // 仅编译 @mfelibs 下及 maraConf.esm 指定模块
  return nodeModulesRegExp([config.esm, esm])
}

// function babelExternalMoudles(esm) {
//   // 无法强制约束使用者行为，故采用保守派策略
//   // 默认编译 node_modules 下所有模块
//   if (!(esm && esm.length)) return nodeModulesRegExp('')

//   // 仅编译 @mfelibs 下及 maraConf.esm 指定模块
//   return nodeModulesRegExp([config.esm, esm])
// }
// 读取marauder.config.js中的babelPlugins
const plugins = []
maraConf.babelPlugins && plugins.join(maraConf.babelPlugins)

plugins.push('transform-decorators-legacy')
// 加入了 inline-json，用于去除编译时的引入json（非全量引入）。
plugins.push(['inline-json', { matchPattern: '.' }])

module.exports.babelLoader = isProd => ({
  test: /\.(js|jsx|mjs)$/,
  include: externalMoudles,
  loader: 'babel-loader',
  options: {
    babelrc: false,
    presets: ['babel-preset-react-app'],
    plugins: plugins,
    compact: isProd,
    // `babel-loader` 特性
    // 在 ./node_modules/.cache/babel-loader/ 中缓存执行结果
    // 提升性能
    cacheDirectory: !isProd,
    highlightCode: true
  }
})

module.exports.babelExternalMoudles = externalMoudles
