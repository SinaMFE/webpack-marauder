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

function reporter(webpackStats, dest, maxBundleGzipSize, maxChunkGzipSize) {
  const { distDir, libDir, entry } = dest
  const statsList = [].concat(webpackStats)
  // https://raw.githubusercontent.com/webpack/analyse/master/app/pages/upload/example.json
  let labelLengthArr = []
  let suggestBundleSplitting = false

  function mainAssetInfo(asset) {
    const isMainBundle = entry && asset.name.indexOf(`${entry}.`) === 0
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

    if (sizeLength < longestSizeLabelLength) {
      const rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength)
      sizeLabel += rightPadding
    }

    console.log(
      '  ' +
        (isLarge ? chalk.yellow(sizeLabel) : sizeLabel) +
        '  ' +
        chalk.dim(asset.folder + path.sep) +
        chalk.cyan(asset.name)
    )
  }

  const assets = statsList.map(stats => {
    const libFormat = stats.publicPath.match(/^__LIB__(\w*)$/i)
    let assetMap = groupBy(
      stats.assets // .filter(asset => /\.(js|css)$/.test(asset.name))
        .map(asset => {
          const buildDir = libFormat ? libDir : distDir
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

    return assetMap
  })

  const longestSizeLabelLength = Math.max.apply(null, labelLengthArr)

  // project build time
  if (!Array.isArray(webpackStats)) {
    console.log('Time:', `${webpackStats.time}ms\n`)
  }

  assets.forEach(assetMap => {
    if (assetMap.format) {
      const formatFlag =
        formatMap[assetMap.format.toUpperCase()] ||
        assetMap.format.toUpperCase()
      console.log()
      console.log(
        chalk.bgGreen.black(` ${formatFlag} `),
        `Time: ${assetMap.time}ms\n`
      )
    } else {
      // console.log('Time:', `${stats.time}ms\n`)
    }

    assetMap.main.sort((a, b) => b.size - a.size).forEach(mainAssetInfo)
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
