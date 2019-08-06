function removeJsExt(asset) {
  return asset.replace(/\.js$/, '')
}

module.exports = class ZenJsPlugin {
  constructor() {
    this.entryPointFiles = []
  }

  genZenJs(compiler) {
    // 在 emit 阶段生成无 js 后缀脚本，以确保被正确压缩
    compiler.plugin('emit', (compilation, callback) => {
      this.entryPointFiles.map(chunkFile => {
        const name = removeJsExt(chunkFile)

        compilation.assets[name] = compilation.assets[chunkFile]
        compilation.assets[name]._fileExt = 'js'

        return chunkFile
      })

      callback()
    })
  }

  collectEntryPointFiles(compilation) {
    const entryNames = Object.keys(compilation.entrypoints)

    this.entryPointFiles = entryNames.reduce((targets, entryName) => {
      const entryPointFiles = compilation.entrypoints[entryName].getFiles()

      return targets.concat(
        entryPointFiles.filter(chunkFile => chunkFile.endsWith('.js'))
      )
    }, [])

    return this.entryPointFiles
  }

  addScriptTypeAttr(compiler) {
    const { publicPath } = compiler.options.output

    compiler.plugin('compilation', compilation => {
      compilation.plugin(
        'html-webpack-plugin-alter-asset-tags',
        (assetTags, callback) => {
          const entryPointFiles = this.collectEntryPointFiles(compilation)
          const isEntryScript = asset => {
            if (asset.tagName !== 'script') return false

            return entryPointFiles.find(
              f => publicPath + f === asset.attributes.src
            )
          }

          assetTags.head
            .concat(assetTags.body)
            .filter(isEntryScript)
            .forEach(script => {
              script.attributes = {
                type: 'text/javascript',
                src: removeJsExt(script.attributes.src)
              }
            })

          callback(null, assetTags)
        }
      )
    })
  }

  apply(compiler) {
    this.genZenJs(compiler)
    this.addScriptTypeAttr(compiler)
  }
}
