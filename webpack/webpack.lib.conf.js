'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const safePostCssParser = require('postcss-safe-parser')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const config = require('../config')
const { banner, getEntries } = require('../libs/utils')

const maraConf = require(config.paths.marauder)
const shouldUseSourceMap = !!maraConf.sourceMap

function getLibraryConf() {
  const pkgName = require(config.paths.packageJson).name

  return pkgName
}

module.exports = function(options) {
  const baseWebpackConfig = require('./webpack.base.conf')('__LIB__')

  const webpackConfig = merge(baseWebpackConfig, {
    mode: 'production',
    // 在第一个错误出错时抛出，而不是无视错误
    bail: true,
    entry: getEntries(config.paths.libEntry),
    devtool: shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: config.paths.lib,
      filename: options.filename,
      library: getLibraryConf(),
      // https://doc.webpack-china.org/configuration/output/#output-librarytarget
      libraryTarget: options.format
    },
    optimization: {
      minimizer: [
        options.minify &&
          new TerserPlugin({
            terserOptions: {
              parse: {
                // we want terser to parse ecma 8 code. However, we don't want it
                // to apply any minfication steps that turns valid ecma 5 code
                // into invalid ecma 5 code. This is why the 'compress' and 'output'
                // sections only apply transformations that are ecma 5 safe
                // https://github.com/facebook/create-react-app/pull/4234
                ecma: 8
              },
              compress: {
                ecma: 5,
                warnings: false,
                // Disabled because of an issue with Uglify breaking seemingly valid code:
                // https://github.com/facebook/create-react-app/issues/2376
                // Pending further investigation:
                // https://github.com/mishoo/UglifyJS2/issues/2011
                comparisons: false,
                // Disabled because of an issue with Terser breaking valid code:
                // https://github.com/facebook/create-react-app/issues/5250
                // Pending futher investigation:
                // https://github.com/terser-js/terser/issues/120
                inline: 2
              },
              mangle: {
                safari10: true
              },
              output: {
                ecma: 5,
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
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  // `inline: false` forces the sourcemap to be output into a
                  // separate file
                  inline: false,
                  // `annotation: true` appends the sourceMappingURL to the end of
                  // the css file, helping the browser find the sourcemap
                  annotation: true
                }
              : false
          },
          canPrint: false // 不显示通知
        })
      ].filter(Boolean)
    },
    plugins: [
      new webpack.DefinePlugin(config.build.env.stringified),
      new webpack.BannerPlugin({
        banner: banner(), // 其值为字符串，将作为注释存在
        entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
      }),
      new MiniCssExtractPlugin({
        filename: options.minify ? 'style.min.css' : 'style.css'
      })
    ].filter(Boolean)
  })

  return webpackConfig
}
