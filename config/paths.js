'use strict'

const path = require(path)
const { rootPath } = require('../libs/utils')

const resolveOwn = relativePath => path.resolve(__dirname, '..', relativePath)

module.exports = {
  app: rootPath('.'),
  dotenv: rootPath('.env'),
  entries: 'src/view/*/index.js',
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
  ownPackage: resolveOwn('package.json')
}
