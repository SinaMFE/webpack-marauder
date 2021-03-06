'use strict'

const path = require('path')
const { rootPath } = require('../libs/utils')

const resolveOwn = relativePath => path.resolve(__dirname, '..', relativePath)

module.exports = {
  'wx-assets': rootPath('src/wx/static'),
  'wx-assets-dist': rootPath('wx-dist/static'),
  'wx-dist': rootPath('wx-dist'),
  'wx-src': rootPath('src/wx'),
  app: rootPath('.'),
  dotenv: rootPath('.env'),
  entries: 'src/view/*/index.@(ts|js)',
  libEntry: 'src/index.@(ts|js)',
  src: rootPath('src'),
  page: rootPath('src/view'),
  public: rootPath('public'),
  dist: rootPath('dist'),
  // 组件打包输出目录
  lib: rootPath('lib'),
  test: rootPath('test'),
  nodeModules: rootPath('node_modules'),
  packageJson: rootPath('package.json'),
  // 配置文件
  marauder: rootPath('marauder.config.js'),
  dll: rootPath('dll'),
  // 脚手架自身路径
  own: resolveOwn('.'),
  ownNodeModules: resolveOwn('node_modules'),
  ownPackageJson: resolveOwn('package.json')
}
