const { rootPath, ensureSlash } = require('../utils/utils')
const marauder = rootPath('marauder.config.js')

function getServedPath() {
  const publicUrl = marauder.publicPath

  // 强制以 / 结尾，为了兼容 publicPath: '.'
  return publicUrl ? ensureSlash(publicUrl, true) : '/'
}

module.exports = {
  app: rootPath('.'),
  entries: 'src/view/*/index.js',
  src: rootPath('src'),
  page: rootPath('src/view'),
  public: rootPath('public'),
  dist: rootPath('dist'),
  test: rootPath('test'),
  nodeModules: rootPath('node_modules'),
  packageJson: rootPath('package.json'),
  marauder: marauder,
  servedPath: getServedPath(),
  dll: rootPath('dll')
}
