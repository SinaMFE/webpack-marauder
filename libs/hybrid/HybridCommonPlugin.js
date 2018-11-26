'use strict'

const t = require('@babel/types')

/**
 * hybrid 共享包
 */
module.exports = class HybridCommonPlugin {
  constructor(options = {}) {
    this.options = options
    this.debug = options.debug
    this.mod = {
      style: [],
      script: []
    }

    try {
      this.assets = require('@mfelibs/hybrid-common/assets')
    } catch (e) {
      this.assets = null
    }
  }

  apply(compiler) {
    if (!this.assets) return

    compiler.hooks.compilation(this.constructor.name, (compilation, data) => {
      data.normalModuleFactory.plugin('parser', (parser, options) => {
        this.resolveImport(parser)
        this.resolveRequire(parser)
        this.resolveMemberRequire(parser)
      })

      this.injectCommonAssets2Html(compilation)
    })
  }

  injectCommonAssets2Html(compilation) {
    compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration(
      this.constructor.name,
      (htmlData, callback) => {
        // assets props [ 'publicPath', 'chunks', 'js', 'css', 'manifest' ]
        const assets = htmlData.assets
        const scripts = this.getAssetsUrlWithSort('script')
        const styles = this.getAssetsUrlWithSort('style')

        // @TODO 支持 image
        assets.js = [...scripts, ...assets.js]
        assets.css = [...styles, ...assets.css]

        this.debug && console.log('common assets script', scripts)
        this.debug && console.log('common assets style', styles)

        callback(null, htmlData)
      }
    )
  }

  getAssetsUrlWithSort(type) {
    return this.mod[type]
      .sort((a, b) => {
        return a.sort - b.sort
      })
      .map(asset => asset.url)
  }

  // e.g. const all = require('@mfelibs/hybrid-common')
  resolveRequire(parser) {
    parser.plugin('evaluate CallExpression', node => {
      if (!this.isMatchedRequireCall(node)) return

      // 默认引入全部
      Object.keys(this.assets).forEach(a => this.addMod(a))

      this.debug && console.log('CallExpression', this.mod)
    })
  }

  // e.g. const React = require('@mfelibs/hybrid-common').React
  resolveMemberRequire(parser) {
    parser.plugin('evaluate MemberExpression', node => {
      if (!this.isMatchedRequireCall(node.object)) return

      if (this.assets[node.property.name]) {
        this.addMod(node.property.name)

        this.debug && console.log('MemberExpression', node.property.name)
      }
    })
  }

  // e.g. import { Vue } from '@mfelibs/hybrid-common'
  resolveImport(parser) {
    parser.plugin('import specifier', (node, source, exportName, name) => {
      if (node.source.value !== '@mfelibs/hybrid-common') return

      this.addMod(exportName)
      this.debug && console.log('Import', exportName)
    })
  }

  isMatchedRequireCall(node) {
    const re = new RegExp(/@mfelibs\/hybrid-common/, 'g')

    return (
      t.isIdentifier(node.callee, { name: 'require' }) &&
      t.isLiteral(node.arguments[0]) &&
      !t.isTemplateLiteral(node.arguments[0]) &&
      node.arguments[0].value.match(re)
    )
  }

  addMod(name) {
    const { type, url, sort } = this.assets[name]

    if (this.mod[type]) {
      this.mod[type].push({ url, sort })
    }
  }
}
