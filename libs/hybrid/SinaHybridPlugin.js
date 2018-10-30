'use strict'

const fs = require('fs')
const devalue = require('devalue')
const chalk = require('chalk')
const ConcatSource = require('webpack-sources/lib/ConcatSource')
const { rootPath } = require('../../libs/utils')

/**
 * 生成版本文件
 * 未来会通过 manifest 中 version 替代
 */
class SinaHybridPlugin {
  constructor(options) {
    this.options = options
    this.name = 'sinaHybridPlugin'
    this.version = process.env.npm_package_version
    this.rewriteField = genRewriteFn([
      rootPath('public/manifest.json'),
      rootPath(`src/view/${this.options.entry}/public/manifest.json`)
    ])
    const pkgVersion = require(rootPath('package.json')).version

    if (pkgVersion !== this.version) {
      throw new Error(
        chalk.red(
          `package.json 版本号不合法，期望值：${chalk.yellow(this.version)}`
        )
      )
    }
  }

  apply(compiler) {
    // 确保在 emit 前调用
    // zip plugin 会在 emit 时打包
    compiler.hooks.compilation.tap(this.name, compilation => {
      const maraCtx = compiler['maraContext'] || {}

      this.genVersionFile(compilation)
      this.updateManifestVersion()
      this.injectDataSource(compilation, maraCtx.dataSource)
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
    this.rewriteField('version', this.version)
  }

  injectDataSource(compilation, dataSource) {
    if (!dataSource) return

    this.prependEntryCode(
      compilation,
      `var __SP_DATA_SOURCE = ${devalue(dataSource)};`
    )
    this.rewriteField('dataSource', dataSource)
  }

  prependEntryCode(compilation, code) {
    const assets = compilation.assets
    const concatSource = (assets, fileName, code) => {
      assets[fileName] = new ConcatSource(code, assets[fileName])
    }

    compilation.hooks.optimizeChunkAssets.tapAsync(
      this.name,
      (chunks, callback) => {
        chunks.forEach(chunk => {
          if (!chunk.isInitial() || !chunk.name) return

          chunk.files
            .filter(fileName => fileName.match(/\.js$/))
            .forEach(fileName => {
              concatSource(assets, fileName, code)
            })
        })

        callback()
      }
    )
  }
}

function genRewriteFn(manPath) {
  return function(field, value) {
    ;[].concat(manPath).forEach(path => {
      try {
        const manifest = require(path)

        // if (manifest.version === version) return

        manifest[field] = value
        fs.writeFileSync(path, JSON.stringify(manifest, null, 2))
      } catch (e) {}
    })
  }
}

module.exports = SinaHybridPlugin
