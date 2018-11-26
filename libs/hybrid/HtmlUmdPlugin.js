'use strict'

const ejs = require('ejs')

/**
 * hybrid 共享包
 */
module.exports = class HybridCommonPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    const injectLink = compiler.options.injectLink

    compiler.hooks.alterAssetTagGroups.tap(htmlData => {
      const injectHead = this.injectFilter(injectLink, 'head')
      const injectBody = this.injectFilter(injectLink, 'body')
    })
  }

  injectFilter(injectLink, injectName) {
    return injectLink
      .map(({ type, onlineUrl, inject }) => {
        if (inject == injectName) {
          if (type == 'js') {
            return {
              tagName: 'script',
              closeTag: true,
              attributes: {
                type: 'text/javascript',
                src: onlineUrl
              }
            }
          } else if (type == 'css') {
            return {
              tagName: 'link',
              selfClosingTag: true,
              attributes: {
                href: onlineUrl,
                rel: 'stylesheet'
              }
            }
          }

          return false
        }

        return false
      })
      .filter(link => (link ? link : false))
  }

  ejsCompile(compilation) {
    compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
      this.constructor.name,
      (htmlData, callback) => {
        callback(null, ejs.compile(htmlData))
      }
    )
  }
}
