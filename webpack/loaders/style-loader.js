'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const config = require('../../config')
const maraConf = require(config.paths.marauder)
const isProd = process.env.NODE_ENV === 'production'
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
  const vueLoader = {
    loader: 'vue-style-loader',
    options: {
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  if (!options.extract) {
    return [vueLoader].concat(loaders)
  }

  const assets = options.library ? '' : `${config.assetsDir}/css`
  // 统一使用 POSIX 风格拼接路径，方便基于 / 做逻辑判断
  const cssFilename = maraConf.hash
    ? path.posix.join(assets, '[name].[contenthash:8].css')
    : path.posix.join(assets, '[name].min.css')

  return [
    {
      loader: MiniCssExtractPlugin.loader,
      options: Object.assign(
        {},
        // Making sure that the publicPath goes back to to build folder.
        shouldUseRelativeAssetPaths
          ? { publicPath: Array(cssFilename.split('/').length).join('../') }
          : undefined
      )
    }
  ].concat(loaders)
}

/**
 * 生成 css loader 配置集合
 * @param  {Object} options 配置参数
 * @return {Object}         结果对象
 */
function cssLoaders(options = {}) {
  const needInlineMinification = isProd && options.extract
  const cssLoader = {
    loader: 'css-loader',
    options: {
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function createLoaders(loader, loaderOptions) {
    let loaders = [cssLoader]
    const pssPlugins = loader ? postcssPlugin : postcssPluginAdvanced
    const cssnanoOptions = Object.assign(
      {
        preset: [
          'default',
          {
            mergeLonghand: false,
            cssDeclarationSorter: false
          }
        ]
      },
      options.sourceMap ? { inline: false } : undefined
    )

    const postcssLoader = {
      loader: 'postcss-loader',
      options: {
        plugins: needInlineMinification
          ? pssPlugins.concat(require('cssnano')(cssnanoOptions))
          : pssPlugins,
        sourceMap: options.sourceMap
      }
    }

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign(
          {
            sourceMap: options.sourceMap
          },
          loaderOptions
        )
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
    css: createLoaders(),
    less: createLoaders('less'),
    sass: createLoaders('sass', { indentedSyntax: true }),
    scss: createLoaders('sass')
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
  styleLoaders,
  postcssPlugin
}
