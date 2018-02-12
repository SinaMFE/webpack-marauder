'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const config = require('../../config')
const maraConf = require(config.paths.marauder)
const shouldUseRelativeAssetPaths = maraConf.publicPath === './'

const postcssPlugin = [
  require('postcss-flexbugs-fixes'),
  autoprefixer(config.postcss)
]

// css 语法增强
const postcssPluginAdvanced = [
  // 提供代码段引入，为了保证引入的代码段能够享受后续的配置
  // 应确保此插件在插件列表中处于第一位
  // https://github.com/postcss/postcss-import
  require('postcss-import')(),
  // 辅助 postcss-import 插件， 解决嵌套层级的图片资源路径问题
  require('postcss-url')(),
  require('postcss-preset-env')(config.postcss),
  ...postcssPlugin
]

// Extract CSS when that option is specified
// (which is the case during production build)
function wrapLoader(options, loaders) {
  if (!options.extract) {
    return ['vue-style-loader'].concat(loaders)
  }

  const assets = options.library ? '' : `${config.assetsDir}/css`
  const cssFilename = maraConf.hash
    ? path.join(assets, '[name].[contenthash:8].css')
    : path.join(assets, '[name].min.css')

  // ExtractTextPlugin expects the build output to be flat.
  // (See https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/27)
  // However, our output is structured with css, js and media folders.
  // To have this structure working with relative paths, we have to use custom options.
  const extractTextPluginOptions = shouldUseRelativeAssetPaths
    ? // Making sure that the publicPath goes back to to build folder.
      { publicPath: Array(cssFilename.split('/').length).join('../') }
    : {}

  return ExtractTextPlugin.extract(
    Object.assign(
      {
        use: loaders,
        fallback: 'vue-style-loader'
      },
      extractTextPluginOptions
    )
  )
}

/**
 * 生成 css loader 配置集合
 * @param  {Object} options 配置参数
 * @return {Object}         结果对象
 */
function cssLoaders(options = {}) {
  const cssLoader = {
    loader: 'css-loader',
    options: {
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    let loaders = [cssLoader]
    const postcssLoader = {
      loader: 'postcss-loader',
      options: {
        plugins: loader ? postcssPlugin : postcssPluginAdvanced,
        sourceMap: options.sourceMap
      }
    }

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // css 默认使用 postcss-loader 处理
    // 由于 vue-loader 自带 postcss，略过
    if (!options.vue) {
      loaders.push(postcssLoader)
    }

    return wrapLoader(options, loaders)
  }

  // http://vuejs.github.io/vue-loader/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass')
  }
}

// Generate loaders for standalone style files (outside of .vue)
function styleLoaders(options) {
  const loaders = cssLoaders(options)

  return Object.keys(loaders).map(ext => ({
    test: new RegExp('\\.' + ext + '$'),
    use: loaders[ext]
  }))
}

module.exports = {
  cssLoaders,
  styleLoaders
}
