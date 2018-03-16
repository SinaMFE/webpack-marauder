'use strict'

var chalk = require('chalk')
var path = require('path')
var utils = require('../libs/utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.wx-base.conf')
var CopyWebpackPlugin = require('copy-webpack-plugin-hash')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
var maraConf = require(config.paths.marauder)
var shouldUseSourceMap = !!maraConf.sourceMap

module.exports = function(entry) {
  var webpackConfig = merge(baseWebpackConfig, {
    entry: entry,
    module: {
      rules: utils.styleLoaders({
				sourceMap: shouldUseSourceMap ? 'source-map' : false,
        extract: true
      })
    },
    bail: true,
    devtool: shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: config.paths['wx-dist'],
      filename: utils.assetsPath('js/[name].js'),
      chunkFilename: utils.assetsPath('js/[id].js')
    },
    plugins: [
      // http://vuejs.github.io/vue-loader/en/workflow/production.html
      new webpack.DefinePlugin({
        'process.env': config.build.env
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        },
        sourceMap: true
      }),
      // extract css into its own file
      new ExtractTextPlugin({
        // filename: utils.assetsPath('css/[name].[contenthash].css')
        filename: utils.assetsPath('css/[name].wxss')
      }),
      // Compress extracted CSS. We are using this plugin so that possible
      // duplicated CSS from different components can be deduped.
      new OptimizeCSSPlugin({
        cssProcessorOptions: {
          safe: true
        }
      }),
      // generate dist index.html with correct asset hash for caching.
      // you can customize output by editing /index.html
      // see https://github.com/ampedandwired/html-webpack-plugin
      // new HtmlWebpackPlugin({
      //   filename: config.build.index,
      //   template: 'index.html',
      //   inject: true,
      //   minify: {
      //     removeComments: true,
      //     collapseWhitespace: true,
      //     removeAttributeQuotes: true
      //     // more options:
      //     // https://github.com/kangax/html-minifier#options-quick-reference
      //   },
      //   // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      //   chunksSortMode: 'dependency'
      // }),
      // keep module.id stable when vender modules does not change
      new webpack.HashedModuleIdsPlugin(),
      // split vendor js into its own file
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function(module, count) {
          // any required modules inside node_modules are extracted to vendor
          return (
            module.resource &&
            /\.js$/.test(module.resource) &&
            module.resource.indexOf('node_modules') >= 0
          ) || count >= 2
        }
      }),
      // extract webpack runtime and module manifest to its own file in order to
      // prevent vendor hash from being updated whenever app bundle is updated
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        chunks: ['vendor']
      }),
      // copy custom static assets
      new CopyWebpackPlugin([{
        from: path.join(config.paths.src, './wx/static'),
        to: path.join(config.paths.src,'./wx-dist/static'),
        ignore: ['.*']
      }])
    ]
  })

  // if (config.build.productionGzip) {
  //   var CompressionWebpackPlugin = require('compression-webpack-plugin')

  //   webpackConfig.plugins.push(
  //     new CompressionWebpackPlugin({
  //       asset: '[path].gz[query]',
  //       algorithm: 'gzip',
  //       test: new RegExp(
  //         '\\.(' +
  //         config.build.productionGzipExtensions.join('|') +
  //         ')$'
  //       ),
  //       threshold: 10240,
  //       minRatio: 0.8
  //     })
  //   )
  // }

  if (config.build.bundleAnalyzerReport) {
    var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  }

  return webpackConfig;
}
