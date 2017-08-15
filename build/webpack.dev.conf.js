const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { styleLoaders, getEntries } = require('./utils')
const baseWebpackConfig = require('./webpack.base.conf4dev')
const config = require('./config')
const cwd = process.cwd()

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(name => {
  baseWebpackConfig.entry[name] = [
    path.resolve(__dirname, 'dev-client')
  ].concat(baseWebpackConfig.entry[name])
})

module.exports = merge(baseWebpackConfig, {
  module: {
    rules: styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrorsPlugin()
  ].concat(
    Object.keys(baseWebpackConfig.entry).map(name => {
      // 每个页面生成一个html
      return new HtmlWebpackPlugin({
        // 生成出来的html文件名
        filename: `${name}.html`,
        // 每个html的模版，这里多个页面使用同一个模版
        template: `html-withimg-loader?min=false!${cwd}/src/view/${name}/index.html`,
        inject: true,
        // 每个html引用的js模块，也可以在这里加上vendor等公用模块
        chunks: [name]
      })
    })
  )
})
