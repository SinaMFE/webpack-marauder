var path = require('path')
var fs = require('fs')
var utils = require('../libs/utils')
var config = require('../config')
var vueLoaderConfig = require('./vue-loader.conf')

function resolve(dir) {
  return path.join(config.paths.src, dir)
}

module.exports = {
  target: require('mpvue-webpack-target'),
  output: {
    path: config.paths['wx-dist'],
    filename: '[name].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', ".ts", ".tsx"],
    alias: {
      'vuex': 'vuex/dist/vuex.js',
      'vue': 'mpvue',
      //代表src
      '@': resolve('./')
    },
    symlinks: false
  },
  module: {
    rules: [{
      test: /\.(tsx|ts)(\?.*)?$/,
      loader: "ts-loader"
    }, {
      test: /\.vue$/,
      loader: 'mpvue-loader',
      options: vueLoaderConfig
    }, {
      test: /\.js$/,
      include: [resolve('wx')],
      use: [
        'babel-loader', {
          loader: 'mpvue-loader',
          options: {
            checkMPEntry: true
          }
        },
      ]
    }, {
      test: /\.mustache$/,
      loader: 'mustache-loader'
    }, {
      test: /\.ejs$/,
      loader: 'marauder-ejs-loader'
    }, {
      test: /\.art$/,
      loader: 'art-template-loader'
    }, {
      test: /\.(bmp|png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: utils.assetsPath('img/[name].[hash:8].[ext]')
      }
    }, {
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: utils.assetsPath('media/[name]].[ext]')
      }
    }, {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'file-loader',
      options: {
        limit: 10000,
        name: utils.assetsPath('fonts/[name].[ext]')
      }
    }]
  },
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
