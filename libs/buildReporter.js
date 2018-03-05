const fs = require('fs')
const path = require('path')
const filesize = require('filesize')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const gzipSize = require('gzip-size').sync
const { groupBy } = require('lodash')

// assetsData：{<Object>: <Array>}
function reporter(assetsData, maxBundleGzipSize, maxChunkGzipSize) {
  // https://raw.githubusercontent.com/webpack/analyse/master/app/pages/upload/example.json
  let labelLengthArr = []
  let suggestBundleSplitting = false
  const isJS = val => /\.js$/.test(val)
  const isCSS = val => /\.css$/.test(val)
  const isMinJS = val => /\.min\.js$/.test(val)

  function mainAssetInfo(info, type) {
    // __format 属性为组件资源特有
    const isMainBundle =
      type === 'page' && info.name.indexOf(`${info.folder}.`) === 0
    const maxRecommendedSize = isMainBundle
      ? maxBundleGzipSize
      : maxChunkGzipSize
    const isLarge = maxRecommendedSize && info.size > maxRecommendedSize

    if (isLarge && isJS(info.name)) {
      suggestBundleSplitting = true
    }

    assetInfo(info, isLarge)
  }

  function assetInfo(info, isLarge = false) {
    let sizeLabel = info.sizeLabel
    const sizeLength = stripAnsi(sizeLabel).length
    const longestSizeLabelLength = Math.max.apply(null, labelLengthArr)
    let assetPath = chalk.dim(info.folder + path.sep) + chalk.cyan(info.name)

    if (isJS(info.name)) {
      // 脚本文件添加模块格式标识
      assetPath += info.format ? chalk.cyan(` (${info.format})`) : ''
    }

    if (sizeLength < longestSizeLabelLength) {
      const rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength)
      sizeLabel += rightPadding
    }

    console.log(
      `  ${isLarge ? chalk.yellow(sizeLabel) : sizeLabel}  ${assetPath}`
    )
  }

  function parseAssets(assets) {
    const seenNames = new Map()
    const assetsInfo = groupBy(
      assets
        .filter(
          a => (seenNames.has(a.name) ? false : seenNames.set(a.name, true))
        )
        .map(asset => {
          const buildDir = assets['__dist'] || asset['__dist']
          const fileContents = fs.readFileSync(path.join(buildDir, asset.name))
          const size = gzipSize(fileContents)
          const sizeLabel = filesize(size)

          labelLengthArr.push(stripAnsi(sizeLabel).length)

          return {
            folder: path.basename(buildDir),
            name: asset.name,
            format: asset['__format'],
            size: size,
            sizeLabel
          }
        }),
      asset => (/\.(js|css)$/.test(asset.name) ? 'main' : 'other')
    )

    assetsInfo.main = assetsInfo.main || []
    assetsInfo.other = assetsInfo.other || []

    return assetsInfo
  }

  const assetList = Object.keys(assetsData).map(type => {
    let assets = assetsData[type]
    let output

    if (type === 'lib') {
      assets = [].concat.apply([], assets)
      output = [parseAssets(assets)]
    } else {
      output = assets.map(a => parseAssets(a))
    }

    return {
      type,
      output
    }
  })

  assetList.forEach(item => {
    if (item.type === 'demo') console.log('\nDEMO:')

    item.output.forEach(assetsInfo => {
      if (item.type === 'demo') console.log()

      assetsInfo.main
        .sort((a, b) => {
          if (isJS(a.name) && isCSS(b.name)) return -1
          if (isCSS(a.name) && isJS(b.name)) return 1
          if (isMinJS(a.name) && !isMinJS(b.name)) return -1
          if (!isMinJS(a.name) && isMinJS(b.name)) return 1
          return b.size - a.size
        })
        .forEach(info => mainAssetInfo(info, item.type))

      assetsInfo.other
        .sort((a, b) => b.size - a.size)
        .forEach(info => assetInfo(info))
    })
  })

  if (suggestBundleSplitting) {
    console.log()
    console.log(
      chalk.yellow('The bundle size is significantly larger than recommended.')
    )
    console.log(
      chalk.yellow(
        'Consider reducing it with code splitting: https://goo.gl/9VhYWB'
      )
    )
    console.log(
      chalk.yellow(
        'You can also analyze the project dependencies: https://goo.gl/LeUzfb'
      )
    )
  }
}

module.exports = reporter
