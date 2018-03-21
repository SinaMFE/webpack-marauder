var utils = require('../libs/utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.wx-base.conf')
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

var path = require('path')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin-hash')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')


module.exports = function(entry) {
  return merge(baseWebpackConfig, {
    entry: entry,
    module: {
      rules: utils.styleLoaders({
        sourceMap: config.dev.cssSourceMap,
        extract: true
      })
    },
    // cheap-module-eval-source-map is faster for development
    // devtool: '#cheap-module-eval-source-map',
    devtool: '#source-map',
    output: {
      path: config.paths['wx-dist'],
      filename: utils.assetsPath('js/[name].js'),
      chunkFilename: utils.assetsPath('js/[id].js')
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': config.dev.env
      }),

      // copy from ./webpack.prod.conf.js
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
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        chunks: ['vendor']
      }),
      // copy custom static assets
      new CopyWebpackPlugin([{
        from: config.paths['wx-assets'],
        to: config.paths['wx-assets-dist'],
        ignore: ['.*']
      }]),

      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      // new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      // https://github.com/ampedandwired/html-webpack-plugin
      // new HtmlWebpackPlugin({
      //   filename: 'index.html',
      //   template: 'index.html',
      //   inject: true
      // }),
      new FriendlyErrorsPlugin()
    ]
  })
};
