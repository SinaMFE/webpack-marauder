'use strict'

const fs = require('fs')
const webpack = require('webpack')
const merge = require('webpack-merge')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin-hash')
const { SinaHybridPlugin } = require('../libs/hybrid')
const HtmlWebpackPlugin = require('sina-html-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const config = require('../config')
const { banner, rootPath } = require('../libs/utils')

const maraConf = require(config.paths.marauder)
const shouldUseSourceMap = !!maraConf.sourceMap

function getLibraryConf() {
  const pkgName = require(config.paths.packageJson).name

  return pkgName
}

module.exports = function({ entry, cmd }) {
  const distPageDir = `${config.paths.dist}/${entry}`
  const baseWebpackConfig = require('./webpack.base.conf')(entry, 'mc')
  const hasHtml = fs.existsSync(`${config.paths.page}/${entry}/index.html`)

  const webpackConfig = merge(baseWebpackConfig, {
    // 在第一个错误出错时抛出，而不是无视错误
    bail: true,
    // entry: getEntries(`src/view/${entry}/index.@(ts|js)`),
    devtool: shouldUseSourceMap ? 'source-map' : false,
    output: {
      path: distPageDir,
      publicPath: config.build.assetsPublicPath,
      filename: maraConf.hash
        ? 'static/js/[name].[chunkhash:8].min.js'
        : 'static/js/[name].min.js',
      library: entry,
      // https://doc.webpack-china.org/configuration/output/#output-librarytarget
      libraryTarget: 'umd'
    },
    plugins: [
      new webpack.DefinePlugin(config.build.env.stringified),
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
        sourceMap: shouldUseSourceMap
      }),
      new webpack.BannerPlugin({
        banner: banner(), // 其值为字符串，将作为注释存在
        entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
      }),
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
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      hasHtml &&
        new HtmlWebpackPlugin({
          // 生成出来的html文件名
          filename: rootPath(`dist/${entry}/index.html`),
          // 每个html的模版，这里多个页面使用同一个模版
          template: `${config.paths.page}/${entry}/index.html`,
          minify: false,
          // 自动将引用插入html
          inject: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true
        }),
      // 确保在 copy Files 之前
      maraConf.hybrid && new SinaHybridPlugin({ entry }),
      ...copyPublicFiles(entry, distPageDir)
    ].filter(Boolean)
  })

  function copyPublicFiles(entry, distPageDir) {
    const pagePublicDir = rootPath(`${config.paths.page}/${entry}/public`)
    const plugins = []

    function getCopyOption(src) {
      return {
        from: src,
        // 放置于根路径
        to: distPageDir,
        ignore: ['.*']
      }
    }

    // 全局 public
    if (fs.existsSync(config.paths.public)) {
      plugins.push(new CopyWebpackPlugin([getCopyOption(config.paths.public)]))
    }

    // 页面级 public，能够覆盖全局 public
    if (fs.existsSync(pagePublicDir)) {
      plugins.push(new CopyWebpackPlugin([getCopyOption(pagePublicDir)]))
    }

    return plugins
  }

  // 重要：确保 zip plugin 在插件列表末尾
  if (maraConf.zip === true || maraConf.hybrid) {
    const ZipPlugin = require('zip-webpack-plugin')
    webpackConfig.plugins.push(
      new ZipPlugin({
        // OPTIONAL: defaults to the Webpack output filename (above) or,
        // if not present, the basename of the path
        filename: entry,
        // OPTIONAL: defaults to 'zip'
        // the file extension to use instead of 'zip'
        // 对 hybrid 项目使用 php 后缀，防止 CDN 劫持(?)
        extension: maraConf.hybrid ? 'php' : 'zip',
        // OPTIONAL: defaults to including everything
        // can be a string, a RegExp, or an array of strings and RegExps
        //   include: [/\.js$/],
        // OPTIONAL: defaults to excluding nothing
        // can be a string, a RegExp, or an array of strings and RegExps
        // if a file matches both include and exclude, exclude takes precedence
        exclude: maraConf.debug
          ? [
              /__MACOSX$/,
              /.DS_Store$/,
              /dependencyGraph.json$/,
              /debug.css$/,
              /build.json$/,
              /js.map$/,
              /css.map$/
            ]
          : [
              /__MACOSX$/,
              /.DS_Store$/,
              /dependencyGraph.json$/,
              /debug.js$/,
              /debug.css$/,
              /build.json$/,
              /js.map$/,
              /css.map$/
            ],

        // yazl Options
        // OPTIONAL: see https://github.com/thejoshwolfe/yazl#addfilerealpath-metadatapath-options
        fileOptions: {
          mtime: new Date(),
          mode: 0o100664,
          compress: true,
          forceZip64Format: false
        },
        // OPTIONAL: see https://github.com/thejoshwolfe/yazl#endoptions-finalsizecallback
        zipOptions: {
          forceZip64Format: false
        }
      })
    )
  }

  return webpackConfig
}
