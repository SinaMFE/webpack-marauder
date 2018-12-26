'use strict'

const webpack = require('webpack')
const config = require('../config')
const { banner, isObject } = require('../libs/utils')
const webpackBaseConf = require('./webpack.base.conf')()
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const maraConf = require(config.paths.marauder)
const { babelLoader } = require('./loaders/babel-loader')
const isProd = process.env.NODE_ENV === 'production'
const library = '[name]_lib'

// 支持两种格式配置
// 数组 vendor: ['react', 'react-dom']
// 对象 vendor: {libs: ['react', 'react-dom']}
const vendor = isObject(maraConf.vendor)
  ? maraConf.vendor.libs
  : maraConf.vendor
// 为多页面准备，生成 xxx_vender 文件夹
const namespace = maraConf.vendor.name ? `${maraConf.vendor.name}_` : ''

module.exports = function() {
  return {
    entry: {
      vendor
    },

    output: {
      filename: '[name].dll.js',
      path: `${config.paths.dist}/${namespace}vendor`,
      library
    },

    resolve: webpackBaseConf.resolve,

    module: {
      rules: [babelLoader(isProd)]
    },

    plugins: [
      new webpack.DefinePlugin(config.build.env.stringified),
      new webpack.DllPlugin({
        path: `${config.paths.dll}/${namespace}manifest.json`,
        // This must match the output.library option above
        name: library
      }),
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 5,
          compress: {
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false
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
        sourceMap: false
      }),
      // 确保在 UglifyJsPlugin 后引入
      new webpack.BannerPlugin({
        banner: banner(), // 其值为字符串，将作为注释存在
        entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
      })
    ]
  }
}
