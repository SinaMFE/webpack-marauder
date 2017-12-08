'use strict'

const path = require('path')
const config = require('../config')
const vueLoaderConfig = require('./loaders/vue-loader.conf')
const { getEntries, nodeModulesRegExp } = require('../utils/utils')
const { styleLoaders } = require('./loaders/style-loader')
const babelLoader = require('./loaders/babel-loader')
const paths = config.paths

const isProd = process.env.NODE_ENV === 'production'
const maraConf = require(paths.marauder)
const shouldUseSourceMap = isProd && !!maraConf.sourceMap
const assetsHash = isProd && !!maraConf.assetsHash ? '.[hash:8]' : ''

function babelExternalMoudles(esm) {
  if (!(esm && esm.length)) return nodeModulesRegExp(config.esm)

  // 当 esm 为 all 时，编译 node_modules 下所有模块
  if (esm === 'all') esm = ''

  return nodeModulesRegExp([].concat(config.esm, esm))
}

module.exports = function(entry) {
  let entryGlob = `src/view/${entry || '*'}/index.js`

  // 判断是否是umd 组件的编译请求：
  if (entry === config.keyword.UMDCOMPILE) {
    entryGlob = 'src/index.js'
  }
  const entries = getEntries(entryGlob, require.resolve('./polyfills'))

  return {
    entry: entries,
    output: {
      path: paths.dist,
      filename: 'static/js/[name].js',
      chunkFilename: 'static/js/[name].chunk.js'
    },
    resolve: {
      extensions: [
        '.mjs',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.web.js',
        '.web.jsx',
        '.vue',
        '.json'
      ],
      modules: ['node_modules', paths.nodeModules],
      alias: {
        vue$: 'vue/dist/vue.esm.js',
        // 使用 `~` 作为 src 别名
        // 使用特殊符号防止与 npm 包冲突
        // import '~/css/style.css'
        '~': paths.src,
        'babel-runtime': path.dirname(
          require.resolve('babel-runtime/package.json')
        ),
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web'
      }
    },
    resolveLoader: {
      modules: [
        path.resolve(__dirname, '../../node_modules'),
        paths.nodeModules
      ]
    },
    module: {
      // makes missing exports an error instead of warning
      strictExportPresence: false,
      loaders: [{ test: /\.html$/, loader: 'html-withimg-loader' }],
      rules: [
        {
          oneOf: [
            ...styleLoaders({
              sourceMap: shouldUseSourceMap,
              extract: isProd,
              minimize: isProd
            }),
            {
              test: /\.(bmp|png|jpe?g|gif|svg)(\?.*)?$/,
              loader: 'url-loader',
              options: {
                limit: 10000,
                name: `static/img/[name]${assetsHash}.[ext]`
              }
            },
            {
              test: /\.ejs$/,
              loader: 'marauder-ejs-loader'
            },
            {
              test: /\.art$/,
              loader: 'art-template-loader'
            },
            {
              test: /\.vue$/,
              loader: 'vue-loader',
              options: vueLoaderConfig
            },
            // Process JS with Babel.
            babelLoader(isProd),
            {
              test: /\.tsx?$/,
              // require.resolve 将会检查模块是否存在
              // ts-loader 为可选配置，所以这里不使用 require.resolve
              loader: 'ts-loader',
              include: [paths.src, paths.test].concat(
                babelExternalMoudles(maraConf.esm)
              ),
              options: {
                appendTsSuffixTo: [/\.vue$/]
              }
            },
            {
              test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
              loader: 'file-loader',
              options: {
                name: `static/fonts/[name]${assetsHash}.[ext]`
              }
            },
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // it's runtime that would otherwise processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/\.js$/, /\.html$/, /\.json$/],
              loader: 'file-loader',
              options: {
                name: `static/media/[name]${assetsHash}.[ext]`
              }
            }
          ]
        }
      ]
    },
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    }
  }
}
