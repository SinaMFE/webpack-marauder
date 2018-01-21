'use strict'

const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const config = require('../../config')
const maraConf = require(config.paths.marauder)

const cssFilename = maraConf.hash
  ? 'static/css/[name].[contenthash:8].css'
  : 'static/css/[name].min.css'
const shouldUseRelativeAssetPaths = maraConf.publicPath === './'
const postcssNormalPlugin = [
  require('postcss-import')(),
  require('postcss-flexbugs-fixes'),
  require('postcss-cssnext')(config.browserslist)
]
const postcssPreProcessorsPlugin = [
  autoprefixer(config.browserslist),
  require('postcss-flexbugs-fixes')
]

// Extract CSS when that option is specified
// (which is the case during production build)
function wrapLoader(options, loaders) {
  if (!options.extract) {
    return ['vue-style-loader'].concat(loaders)
  }

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
    loader: require.resolve('css-loader'),
    options: {
      // 启用压缩
      minimize: options.minimize,
      importLoaders: 1,
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    let loaders = [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // vue-loader 自带 postcss，不做处理
    if (!options.vue) {
      // css 默认使用 postcss-loader 处理
      // 使用 cssnext 提供变量支持，
      // postcss-import 提供代码段引入
      loaders.push({
        loader: require.resolve('postcss-loader'),
        options: {
          plugins: loader ? postcssPreProcessorsPlugin : postcssNormalPlugin,
          sourceMap: options.sourceMap
        }
      })
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
