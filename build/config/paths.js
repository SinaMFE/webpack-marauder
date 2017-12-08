'use strict'

const { rootPath } = require('../utils/utils')

module.exports = {
  app: rootPath('.'),
  dotenv: rootPath('.env'),
  entries: 'src/view/*/index.js',
  src: rootPath('src'),
  page: rootPath('src/view'),
  public: rootPath('public'),
  dist: rootPath('dist'),
  test: rootPath('test'),
  nodeModules: rootPath('node_modules'),
  packageJson: rootPath('package.json'),
  marauder: rootPath('marauder.config.js'),
  dll: rootPath('dll')
}
