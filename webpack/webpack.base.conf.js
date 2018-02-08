'use strict'

const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const config = require('../config')
const vueLoaderConfig = require('./loaders/vue-loader.conf')
const { getEntries, getChunks, nodeModulesRegExp } = require('../libs/utils')
const { styleLoaders } = require('./loaders/style-loader')
const babelLoader = require('./loaders/babel-loader')
const paths = config.paths

const isProd = process.env.NODE_ENV === 'production'
const maraConf = require(paths.marauder)
const shouldUseSourceMap = isProd && !!maraConf.sourceMap

function babelExternalMoudles(esm) {
  if (!(esm && esm.length)) return nodeModulesRegExp(config.esm)

  // 当 esm 为 all 时，编译 node_modules 下所有模块
  if (esm === 'all') esm = ''

  return nodeModulesRegExp([].concat(config.esm, esm))
}

function parseEntry(entry) {
  const entryGlob = `src/view/${entry}/index.js`
  const chunkGlob = `src/view/${entry}/index.*.js`
  const entryObj = getEntries(entryGlob, require.resolve('./polyfills'))
  const chunkObj = getChunks(chunkGlob)
  const chunks = Object.values(chunkObj).reduce(
    (res, cur) => res.concat(cur),
    []
  )
  const devEntry = { [entry]: entryObj[entry].concat(chunks) }
  // 保证 entryObj 为第一位
  const prodEntry = Object.assign(chunkObj, entryObj)

  return { devEntry, prodEntry }
}

module.exports = function(entry) {
  const { devEntry, prodEntry } = parseEntry(entry)

  return {
    entry: isProd ? prodEntry : devEntry,
    output: {
      path: paths.dist,
      filename: 'static/js/[name].js',
      chunkFilename: 'static/js/[name].async.js'
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
      modules: ['node_modules'],
      alias: {
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
      },
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.src, [paths.packageJson])
      ]
    },
    resolveLoader: {
      modules: [paths.ownNodeModules, paths.nodeModules]
    },
    module: {
      // makes missing exports an error instead of warning
      strictExportPresence: false,
      loaders: [{ test: /\.html$/, loader: 'html-withimg-loader' }],
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },
        {
          oneOf: [
            ...styleLoaders({
              sourceMap: shouldUseSourceMap,
              extract: isProd
            }),
            {
              test: /\.(bmp|png|jpe?g|gif|svg)(\?.*)?$/,
              loader: 'url-loader',
              options: {
                limit: 10000,
                name: `static/img/[name].[hash:8].[ext]`
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
                name: `static/fonts/[name].[hash:8].[ext]`
              }
            },
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // it's runtime that would otherwise processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              loader: 'file-loader',
              exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
              options: {
                name: `static/media/[name].[hash:8].[ext]`
              }
            }
          ]
        }
      ]
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
}
