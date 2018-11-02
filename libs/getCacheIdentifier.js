const hash = require('hash-sum')
const config = require('../config')
const { readJson } = require('./utils')
const maraConfig = readJson(config.paths.marauder)
const tsConfig = readJson(config.paths.tsConfig)
const mode = process.env.NODE_ENV === 'development' ? 'dev' : 'build'

module.exports = function getCacheIdentifier(packages = []) {
  const pkgNames = ['webpack-marauder', 'cache-loader'].concat(packages)
  const pkgIds = pkgNames.reduce((pkgs, name) => {
    try {
      pkgs[name] = require(`${name}/package.json`).version
    } catch (e) {
      // ignored
    }

    return pkgs
  }, {})

  return hash({
    pkgIds,
    maraConfig,
    tsConfig,
    env: config[mode].env.stringified
  })
}
