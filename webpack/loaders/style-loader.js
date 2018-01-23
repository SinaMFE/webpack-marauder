'use strict'

const autoprefixer = require('autoprefixer')
const browserslist = require('browserslist')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const config = require('../../config')
const maraConf = require(config.paths.marauder)

const cssFilename = maraConf.hash
  ? 'static/css/[name].[contenthash:8].css'
  : 'static/css/[name].min.css'
const shouldUseRelativeAssetPaths = maraConf.publicPath === './'

const postcssPlugin = [
  // 提供代码段引入，为了保证引入的代码段能够享受后续的配置
  // 应确保此插件在插件列表中处于第一位
  // https://github.com/postcss/postcss-import
  require('postcss-import')(),
  // 辅助 postcss-import 插件， 解决嵌套层级的图片资源路径问题
  require('postcss-url')(),
  require('postcss-flexbugs-fixes'),
  require('postcss-cssnext')(config.browserslist)
]

// 与预处理器集成
// 由于预处理器拥有自定义语法
// 所以这里不使用 cssnext import 等 postcss 语法增强插件
const postcssWithPreProcessors = [
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
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    let loaders = [cssLoader]
    const postcssLoader = {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: loader ? postcssWithPreProcessors : postcssPlugin,
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
