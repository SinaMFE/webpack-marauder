'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('sina-html-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const { getChunks } = require('../libs/utils')
const config = require('../config')

function parseChunks(entry) {
  const chunkObj = getChunks(`src/view/${entry}/index.*.js`)
  const chunks = [].concat(...Object.values(chunkObj))

  return { [entry]: chunks }
}

module.exports = function({ entry }) {
  const baseWebpackConfig = require('./webpack.base.conf')(entry)
  const chunksEntry = parseChunks(entry)
  const { transformer, formatter } = require('../libs/resolveLoaderError')

  // https://github.com/survivejs/webpack-merge
  // 当 entry 为数组时，webpack-merge 默认执行 append
  const webpackConfig = merge(baseWebpackConfig, {
    devtool: 'cheap-module-source-map',
    entry: chunksEntry,
    output: {
      publicPath: config.dev.assetsPublicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true
    },
    plugins: [
      new webpack.DefinePlugin(config.dev.env.stringified),
      // 替换 html 内的环境变量
      // %PUBLIC% 转换为具体路径
      // 在 dev 环境下为空字符串
      new InterpolateHtmlPlugin(config.dev.env.raw),
      new webpack.NamedModulesPlugin(),
      new DuplicatePackageCheckerPlugin({
        // show details
        verbose: true,
        showHelp: false,
        // show warning
        emitError: false,
        // check major version
        strict: true
      }),
      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      new webpack.HotModuleReplacementPlugin(),
      // 出错时只打印错误，但不重新加载页面
      new webpack.NoEmitOnErrorsPlugin(),
      // 安装缺失模块后不用重启服务
      new WatchMissingNodeModulesPlugin(config.paths.nodeModules),
      // friendly error plugin displays very confusing errors when webpack
      // fails to resolve a loader, so we provide custom handlers to improve it
      new FriendlyErrorsPlugin({
        additionalTransformers: [transformer],
        additionalFormatters: [formatter]
      }),
      new CaseSensitivePathsPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new HtmlWebpackPlugin({
        // 以页面文件夹名作为模板名称
        filename: `${entry}.html`,
        // 生成各自的 html 模板
        template: `${config.paths.page}/${entry}/index.html`,
        inject: true,
        // 每个html引用的js模块，也可以在这里加上vendor等公用模块
        chunks: [entry]
      })
    ],
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: false
    }
  })

  return webpackConfig
}
