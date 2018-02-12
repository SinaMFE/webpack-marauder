'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const marauderDebug = require('sinamfe-marauder-debug')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const config = require('../config')
const { banner, rootPath } = require('../libs/utils')

const maraConf = require(config.paths.marauder)
const shouldUseSourceMap = !!maraConf.sourceMap
// 压缩配置
const compress = Object.assign(config.compress, maraConf.compress)

function getLibraryConf() {
  const pkgName = require(config.paths.packageJson).name

  return pkgName
}

module.exports = function(options) {
  const baseWebpackConfig = require('./webpack.base.conf')('__LIB__')

  const webpackConfig = merge(baseWebpackConfig, {
    // 在第一个错误出错时抛出，而不是无视错误
    bail: true,
    entry: rootPath('src/index.js'),
    devtool: shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: config.paths.lib,
      filename: options.filename,
      library: getLibraryConf(),
      // https://doc.webpack-china.org/configuration/output/#output-librarytarget
      libraryTarget: options.format
    },
    plugins: [
      new webpack.DefinePlugin(config.build.env.stringified),
      options.minify &&
        new UglifyJsPlugin({
          uglifyOptions: {
            ecma: 8,
            compress: {
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              drop_console: compress.drop_console
            },
            mangle: {
              safari10: true
            },
            output: {
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true
            }
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: shouldUseSourceMap
        }),
      new webpack.BannerPlugin({
        banner: banner(), // 其值为字符串，将作为注释存在
        entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
      }),
      new ExtractTextPlugin({
        filename: options.minify ? 'style.min.css' : 'style.css'
      }),
      options.minify &&
        new OptimizeCssAssetsPlugin({
          // cssnano 中自带 autoprefixer，在压缩时会根据配置去除无用前缀
          // 为保持统一，将其禁用，在 4.0 版本后将会默认禁用
          // safe: true 禁止计算 z-index
          cssProcessorOptions: Object.assign(
            { autoprefixer: false, safe: true },
            shouldUseSourceMap
              ? {
                  map: { inline: false }
                }
              : {}
          ),
          canPrint: false // 不显示通知
        }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ].filter(Boolean)
  })

  return webpackConfig
}
