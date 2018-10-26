'use strict'

const path = require('path')
const config = require('../config')
const vueLoaderConfig = require('./loaders/vue-loader.conf')
const { getEntries } = require('../libs/utils')
const paths = config.paths

const isProd = process.env.NODE_ENV === 'production'
const maraConf = require(paths.marauder)
const shouldUseSourceMap = isProd && !!maraConf.sourceMap

module.exports = function(entry) {
  const webpack = require('webpack')
  const PnpWebpackPlugin = require('pnp-webpack-plugin')
  const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
  const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
  const { styleLoaders } = require('./loaders/style-loader')
  const VueLoaderPlugin = require('vue-loader/lib/plugin')
  const {
    babelLoader,
    babelExternalMoudles
  } = require('./loaders/babel-loader')
  const isLib = entry === '__LIB__'
  const ASSETS = isLib ? '' : config.assetsDir
  const entryGlob = `src/view/${entry}/index.@(ts|js)`

  return {
    // dev, build 环境依赖 base.entry，务必提供
    entry: getEntries(entryGlob, require.resolve('./polyfills')),
    output: {
      path: paths.dist,
      // 统一使用 POSIX 风格拼接路径
      // webpack 将会处理平台差异
      // 如果使用 path.join 在 Windows 上会出现路径异常
      filename: path.posix.join(ASSETS, 'js/[name].js'),
      chunkFilename: path.posix.join(ASSETS, 'js/[name].chunk.js')
    },
    resolve: {
      // disable symlinks
      symlinks: false,
      // js first
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.sn', '.vue', '.json'],
      // https://doc.webpack-china.org/configuration/resolve/#resolve-mainfields
      // source 为自定义拓展属性，表示源码入口
      mainFields: ['source', 'browser', 'module', 'main'],
      modules: ['node_modules'],
      alias: {
        // 使用 `~` 作为 src 别名
        // 使用特殊符号防止与 npm 包冲突
        // import '~/css/style.css'
        '~': paths.src,
        vue$: 'vue/dist/vue.esm.js',
        'babel-runtime': path.dirname(
          require.resolve('babel-runtime/package.json')
        )
      },
      plugins: [
        // Adds support for installing with Plug'n'Play, leading to faster installs and adding
        // guards against forgotten dependencies and such.
        PnpWebpackPlugin,
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.src, [paths.packageJson])
      ]
    },
    resolveLoader: {
      plugins: [
        // Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
        // from the current package.
        PnpWebpackPlugin.moduleLoader(module)
      ]
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        // 为了兼容  bundle-loader 暂时不启用
        // { parser: { requireEnsure: false } },
        {
          oneOf: [
            ...styleLoaders({
              sourceMap: shouldUseSourceMap,
              extract: isProd,
              library: isLib
            }),
            {
              test: /\.(bmp|png|jpe?g|gif|svg)(\?.*)?$/,
              loader: 'url-loader',
              options: {
                limit: 10000,
                name: path.posix.join(ASSETS, 'img/[name].[hash:8].[ext]')
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
              test: /\.(vue|sn)$/,
              loader: 'vue-loader',
              options: vueLoaderConfig
            },
            // Process JS with Babel.
            ...babelLoader(isProd),
            {
              test: /\.tsx?$/,
              // require.resolve 将会检查模块是否存在
              // ts-loader 为可选配置，所以这里不使用 require.resolve
              loader: 'ts-loader',
              include: babelExternalMoudles,
              options: {
                appendTsSuffixTo: [/\.vue$/]
              }
            },
            {
              test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
              loader: 'file-loader',
              options: {
                name: path.posix.join(ASSETS, 'fonts/[name].[hash:8].[ext]')
              }
            },
            {
              test: /\.(html)$/,
              use: {
                loader: 'html-loader',
                options: {
                  attrs: [':src', ':data-src']
                }
              }
            },
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // it's runtime that would otherwise processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              loader: 'file-loader',
              exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/],
              options: {
                name: path.posix.join(ASSETS, 'media/[name].[hash:8].[ext]')
              }
            }
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ]
        }
      ]
    },
    plugins: [
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.app),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
      // new VueLoaderPlugin()
    ],
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
