const _require = require('webpack-sources')
const RawSource = _require.RawSource

class BuildDebug {
  constructor(options) {
    this.name = 'buildDebugPlugin'
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(this.constructor.name, compilation => {
      compilation.hooks.optimizeChunkAssets.tapAsync(
        this.name,
        (chunks, callback) => {
          const files = [].concat.apply([], chunks.map(e => e.files))
          const jsRegex = /\.js($|\?)/i

          // compilation.additionalChunkAssets.forEach(function(file) {
          //   return files.push(file)
          // })
          files.filter(file => jsRegex.test(file)).forEach(file => {
            try {
              const asset = compilation.assets[file]

              if (asset.__babilified) {
                compilation.assets[file] = asset.__babilified
                return
              }

              const input = asset.source()

              compilation.assets[
                file
                  .replace('min.js', 'debug.js')
                  .replace('min.css', 'debug.css')
              ] = new RawSource(input)
            } catch (e) {
              compilation.errors.push(e)
            }
          })

          callback()
        }
      )
    })
  }
}

module.exports = BuildDebug
