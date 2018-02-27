const fs = require('fs')
const path = require('path')
const filesize = require('filesize')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const gzipSize = require('gzip-size').sync
const { groupBy } = require('lodash')

const formatMap = {
  COMMONJS2: 'CJS'
}

function reporter(webpackStats, maxBundleGzipSize, maxChunkGzipSize) {
  const statsList = [].concat(webpackStats)
  // https://raw.githubusercontent.com/webpack/analyse/master/app/pages/upload/example.json
  let labelLengthArr = []
  let suggestBundleSplitting = false

  function mainAssetInfo(asset, format) {
    const isMainBundle = !format && asset.name.indexOf(`${asset.folder}.`) === 0
    const maxRecommendedSize = isMainBundle
      ? maxBundleGzipSize
      : maxChunkGzipSize
    const isLarge = maxRecommendedSize && asset.size > maxRecommendedSize

    if (isLarge && path.extname(asset.name) === '.js') {
      suggestBundleSplitting = true
    }

    assetInfo(asset, isLarge)
  }

  function assetInfo(asset, isLarge = false) {
    let sizeLabel = asset.sizeLabel
    const sizeLength = stripAnsi(sizeLabel).length
    const assetPath =
      chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name)

    if (sizeLength < longestSizeLabelLength) {
      const rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength)
      sizeLabel += rightPadding
    }

    console.log(
      `  ${isLarge ? chalk.yellow(sizeLabel) : sizeLabel}  ${assetPath}`
    )
  }

  const assets = statsList.map(stats => {
    const libFormat = stats.publicPath.match(/^__LIB__(\w*)$/i)
    let assetMap = groupBy(
      stats.assets // .filter(asset => /\.(js|css)$/.test(asset.name))
        .map(asset => {
          const buildDir = stats['__path']
          const fileContents = fs.readFileSync(path.join(buildDir, asset.name))
          const size = gzipSize(fileContents)
          const sizeLabel = filesize(size)

          labelLengthArr.push(stripAnsi(sizeLabel).length)

          return {
            folder: path.basename(buildDir),
            name: asset.name,
            size: size,
            sizeLabel
          }
        }),
      asset => (/\.(js|css)$/.test(asset.name) ? 'main' : 'other')
    )

    assetMap.format = libFormat && libFormat[1]
    assetMap.time = stats.time
    assetMap.main = assetMap.main || []
    assetMap.other = assetMap.other || []

    return assetMap
  })

  const longestSizeLabelLength = Math.max.apply(null, labelLengthArr)

  assets.forEach(assetMap => {
    if (assetMap.format) {
      const formatFlag =
        formatMap[assetMap.format.toUpperCase()] ||
        assetMap.format.toUpperCase()
      console.log()
      console.log(
        chalk.bgGreen.black(` ${formatFlag} `),
        `Time: ${assetMap.time}ms`
      )
    } else if (statsList.length > 1) {
      console.log(`\nDEMO Time:`, `${assetMap.time}ms`)
    }

    assetMap.main
      .sort((a, b) => b.size - a.size)
      .forEach(asset => mainAssetInfo(asset, assetMap.format))

    assetMap.other
      .sort((a, b) => b.size - a.size)
      .forEach(asset => assetInfo(asset))
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
