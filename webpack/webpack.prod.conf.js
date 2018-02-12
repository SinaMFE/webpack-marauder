'use strict'

const fs = require('fs')
const webpack = require('webpack')
const merge = require('webpack-merge')
const chalk = require('chalk')
const CopyWebpackPlugin = require('copy-webpack-plugin-hash')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const marauderDebug = require('sinamfe-marauder-debug')
const moduleDependency = require('sinamfe-webpack-module_dependency')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const config = require('../config')
const { banner, rootPath, getChunks, isObject } = require('../libs/utils')

const maraConf = require(config.paths.marauder)
const shouldUseSourceMap = !!maraConf.sourceMap
// 压缩配置
const compress = Object.assign(config.compress, maraConf.compress)

module.exports = function({ entry }) {
  const distPageDir = `${config.paths.dist}/${entry}`
  const baseWebpackConfig = require('./webpack.base.conf')(entry)
  const hasHtml = fs.existsSync(`${config.paths.page}/${entry}/index.html`)
  const chunksEntry = getChunks(`src/view/${entry}/index.*.js`)

  // https://github.com/survivejs/webpack-merge
  const webpackConfig = merge(baseWebpackConfig, {
    // 在第一个错误出错时抛出，而不是无视错误
    bail: true,
    devtool: shouldUseSourceMap ? 'source-map' : false,
    entry: chunksEntry,
    output: {
      path: distPageDir,
      publicPath: config.build.assetsPublicPath,
      filename: maraConf.hash
        ? 'static/js/[name].[chunkhash:8].min.js'
        : 'static/js/[name].min.js',
      chunkFilename: maraConf.chunkHash
        ? 'static/js/[name].[chunkhash:8].async.js'
        : 'static/js/[name].async.js'
    },
    plugins: [
      new InterpolateHtmlPlugin(config.build.env.raw),
      new webpack.DefinePlugin(config.build.env.stringified),
      // 使作作用域提升(scope hoisting)
      // https://medium.com/webpack/brief-introduction-to-scope-hoisting-in-webpack-8435084c171f
      new webpack.optimize.ModuleConcatenationPlugin(),
      new marauderDebug(),
      // Minify the code.
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
      // new webpack.ProvidePlugin({
      //   $: 'zepto',
      //   Zepto: 'zepto',
      //   'window.Zepto': 'zepto',
      //   'window.$': 'zepto'
      // }),
      new webpack.BannerPlugin({
        banner: banner(), // 其值为字符串，将作为注释存在
        entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
      }),
      new ExtractTextPlugin({
        filename: maraConf.hash
          ? 'static/css/[name].[contenthash:8].css'
          : 'static/css/[name].min.css'
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
          template: `html-withimg-loader?min=false!${
            config.paths.page
          }/${entry}/index.html`,
          minify: false,
          // 自动将引用插入html
          inject: true,
          // 模块排序，common > entry > servant
          chunksSortMode(a, b) {
            const chunkNames = Object.keys(chunksEntry).sort()
            const order = ['common', entry].concat(chunkNames)

            return order.indexOf(a.names[0]) - order.indexOf(b.names[0])
          },
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true
        }),
      new moduleDependency()
    ].filter(Boolean)
  })

  if (maraConf.ensurels) {
    const ensure_ls = require('sinamfe-marauder-ensure-ls')
    webpackConfig.plugins.push(new ensure_ls())
  }

  // copy project public assets
  if (fs.existsSync(config.paths.public)) {
    webpackConfig.plugins.push(
      new CopyWebpackPlugin([
        {
          from: config.paths.public,
          to: distPageDir + '/static',
          ignore: ['.*']
        }
      ])
    )
  }

  // copy page public assets
  const pagePublicDir = rootPath(`${config.paths.page}/${entry}/public`)
  if (fs.existsSync(pagePublicDir)) {
    webpackConfig.plugins.push(
      new CopyWebpackPlugin([
        {
          from: pagePublicDir,
          to: distPageDir,
          ignore: ['.*']
        }
      ])
    )
  }

  const vendorConf = maraConf.vendor || []
  if (Object.keys(vendorConf).length) {
    if (isObject(vendorConf) && !vendorConf.libs) {
      console.log(
        chalk.yellow(
          'Build skip, vendor.libs is undefined. Please check marauder.config.js'
        )
      )
      process.exit(0)
    }

    let manifest = ''
    // 为多页面准备，生成 xxx_vender 文件夹
    const namespace = maraConf.vendor.name ? `${maraConf.vendor.name}_` : ''

    try {
      manifest = require(`${config.paths.dll}/${namespace}manifest.json`)
    } catch (err) {
      console.log(
        chalk.yellow(
          `dll/${namespace}manifest.json 未生成，请执行 npm run dll\n`
        )
      )
      process.exit(1)
    }

    webpackConfig.plugins.push(
      new webpack.DllReferencePlugin({
        manifest: manifest
      })
    )
  }

  // bundle 大小分析
  if (config.build.bundleAnalyzerReport) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
      .BundleAnalyzerPlugin
    webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  }

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
        exclude: [
          /__MACOSX$/,
          /.DS_Store$/,
          /dependencyGraph.json$/,
          /debug.js$/,
          /debug.css$/,
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

  // @TODO publish npm module
  // 生成serviceworker
  // if (maraConf.sw) {
  //   const webpackWS = require('@mfelibs/webpack-create-serviceworker')
  //   const swConfig = maraConf.sw_config || {}
  //   webpackConfig.plugins.push(new webpackWS(swConfig))
  // }

  return webpackConfig
}
