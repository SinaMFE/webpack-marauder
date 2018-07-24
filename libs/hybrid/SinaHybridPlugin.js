'use strict'

const fs = require('fs')
const { rootPath } = require('../../libs/utils')

/**
 * 生成版本文件
 * 未来会通过 manifest 中 version 替代
 */
class SinaHybridPlugin {
  constructor(options) {
    this.options = options
    this.version = process.env.npm_package_version
  }

  apply(compiler) {
    // 确保在 emit 前调用
    // zip plugin 会在 emit 时打包
    compiler.plugin('emit', (compilation, callback) => {
      this.genVersionFile(compilation)
      this.updateManifestVersion()

      callback()
    })
  }

  genVersionFile(compilation) {
    compilation.assets[this.version] = {
      // both method
      source: () => '',
      size: () => 0
    }
  }

  updateManifestVersion() {
    rewriteVerField(
      [
        rootPath('public/manifest.json'),
        rootPath(`src/view/${this.options.entry}/public/manifest.json`)
      ],
      this.version
    )
  }
}

function rewriteVerField(manPath, version) {
  ;[].concat(manPath).forEach(path => {
    try {
      const manifest = require(path)

      if (manifest.version === version) return

      manifest.version = version
      fs.writeFileSync(path, JSON.stringify(manifest, null, 2))
    } catch (e) {}
  })
}

module.exports = SinaHybridPlugin
