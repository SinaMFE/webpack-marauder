'use strict'

const t = require('@babel/types')

/**
 * hybrid 共享包
 */
module.exports = class HybridCommonPlugin {
  constructor(options = {}) {
    this.options = options
    this.debug = options.debug
    this.mod = new Map()
    this.assets = require('@mfelibs/hybrid-common/assets')
  }

  apply(compiler) {
    const maraCtx = compiler['maraContext'] || {}

    compiler.plugin('compilation', (compilation, data) => {
      data.normalModuleFactory.plugin('parser', (parser, options) => {
        this.resolveImport(parser)
        this.resolveRequire(parser)
        this.resolveMemberRequire(parser)

        this.writeMaraContext(compiler, maraCtx)
      })
    })
  }

  writeMaraContext(compiler, maraCtx) {
    maraCtx.common = {
      style: [],
      script: [...this.mod.values()]
    }

    compiler['maraContext'] = maraCtx
  }

  // e.g. const all = require('@mfelibs/hybrid-common')
  resolveRequire(parser) {
    parser.plugin('evaluate CallExpression', node => {
      if (!this.isMatchedRequireCall(node)) return

      Object.keys(this.assets).forEach(v => this.addMod(v))

      this.debug && console.log('CallExpression', this.mod)
    })
  }

  // e.g. const React = require('@mfelibs/hybrid-common').React
  resolveMemberRequire(parser) {
    parser.plugin('evaluate MemberExpression', node => {
      if (!this.isMatchedRequireCall(node.object)) return

      if (this.assets[node.property.name]) {
        this.addMod(node.property.name)

        this.debug && console.log('MemberExpression', this.mod)
      }
    })
  }

  // e.g. import { Vue } from '@mfelibs/hybrid-common'
  resolveImport(parser) {
    parser.plugin('import specifier', (node, source, exportName, name) => {
      if (node.source.value !== '@mfelibs/hybrid-common') return

      this.addMod(exportName)
      this.debug && console.log('mod', this.mod)
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

  addMod(name, url) {
    this.mod.set(name, this.assets[name])
  }
}
