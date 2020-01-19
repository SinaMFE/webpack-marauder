'use strict'

const fs = require('fs')
const devalue = require('devalue')
const chalk = require('chalk')
const ConcatSource = require('webpack-sources/lib/ConcatSource')
const { rootPath, isInstalled } = require('../../libs/utils')
const HYBRID_MANIFEST_INJECT_NAME = '__HB_MANIFEST'

function readJsonFile(filePath) {
  if (typeof filePath !== 'string') throw new Error('manifest 路径错误')

  const fileText = fs.readFileSync(filePath, 'utf8')

  try {
    return JSON.parse(fileText)
  } catch (e) {
    throw new Error('manifest json 解析错误')
  }
}

/**
 * 生成版本文件
 * 未来会通过 manifest 中 version 替代
 */
class SinaHybridPlugin {
  constructor(options) {
    this.options = options
    this.version = process.env.npm_package_version
    this.useCommonPkg = options.useCommonPkg
    this.commonPkgPath = options.commonPkgPath
    this.manifestPath = rootPath(
      `src/view/${this.options.entry}/public/manifest.json`
    )
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
    let manifestAsset = ''

    // 确保在 emit 前调用
    // zip plugin 会在 emit 时打包
    compiler.plugin('compilation', compilation => {
      const maraCtx = compiler['maraContext'] || {}
      const { publicPath } = compiler.options.output

      this.injectCommonAssets(compilation, publicPath)
      // this.splitSNC(compilation)
      this.genVersionFile(compilation)
      this.injectDataSource(compilation, maraCtx.dataSource)

      // callback()
    })

    if (fs.existsSync(this.manifestPath)) {
      compiler.plugin('this-compilation', compilation => {
        const maraCtx = compiler['maraContext'] || {}

        manifestAsset = this.genManifest(maraCtx.dataSource)

        compilation.plugin('additional-chunk-assets', () => {
          compilation.assets['manifest.json'] = manifestAsset
        })

        this.prependEntryCode(
          compilation,
          `window["${HYBRID_MANIFEST_INJECT_NAME}"] = ${manifestAsset.source()};`
        )
      })
    }
  }

  genCommonAssets() {
    const source = fs.readFileSync(this.commonPkgPath, 'utf8')

    return {
      source: () => source,
      size: () => source.length
    }
  }

  genVersionFile(compilation) {
    compilation.assets[this.version] = {
      // both method
      source: () => '',
      size: () => 0
    }
  }

  injectDataSource(compilation, dataSource) {
    if (!dataSource) return

    this.prependEntryCode(
      compilation,
      `var __SP_DATA_SOURCE = ${devalue(dataSource)};`
    )
  }

  injectCommonAssets(compilation, publicPath) {
    if (!this.useCommonPkg) return

    const filePath = 'static/js/__SINA_COMMON_PKG__.js'

    compilation.assets[filePath] = this.genCommonAssets()

    compilation.plugin(
      'html-webpack-plugin-alter-asset-tags',
      (assets, callback) => {
        assets.head.push({
          tagName: 'script',
          attributes: {
            src: publicPath + filePath
          },
          closeTag: true
        })

        callback(null, assets)
      }
    )
  }

  splitSNC(compilation) {
    if (!this.useCommonPkg) return

    compilation.plugin(
      'html-webpack-plugin-alter-asset-tags',
      (assets, callback) => {
        const idx = assets.body.findIndex(tag => {
          return tag.attributes.src.indexOf('__UNI_SNC__.') > -1
        })

        if (idx < 0) return callback(null, assets)

        assets.head.push({
          tagName: 'script',
          attributes: { src: assets.body[idx].attributes.src },
          closeTag: true
        })

        assets.body.splice(idx, 1)

        callback(null, assets)
      }
    )
  }

  prependEntryCode(compilation, code) {
    const assets = compilation.assets
    const concatSource = (assets, fileName, code) => {
      assets[fileName] = new ConcatSource(code, assets[fileName])
    }

    compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
      chunks.forEach(chunk => {
        if (!chunk.isInitial() || !chunk.name) return

        chunk.files
          .filter(fileName => fileName.match(/\.js$/))
          .forEach(fileName => {
            concatSource(assets, fileName, code)
          })
      })

      callback()
    })
  }

  resolveManifest() {
    let manifest

    try {
      manifest = this.manifestPath ? readJsonFile(this.manifestPath) : {}
    } catch (e) {
      // 未设置 manifest 时，设置缺省配置
      manifest = {}
    }

    return manifest
  }

  genManifest(dataSource) {
    let manifest = this.resolveManifest()
    const version = { version: this.version }

    // 确保将 version 排序至第一位
    // 第一个 version 是为了将字段提升至第一位
    // 最后一个 version 是为了覆盖原有值
    manifest = Object.assign({}, version, manifest, version)

    if (dataSource) {
      manifest.dataSource = dataSource
    }

    const source = JSON.stringify(manifest, null, 2)

    return {
      source: () => source,
      size: () => source.length
    }
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
