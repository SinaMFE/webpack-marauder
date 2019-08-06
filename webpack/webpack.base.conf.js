'use strict'

const path = require('path')
const config = require('../config')
const vueLoaderConfig = require('./loaders/vue-loader.conf')
const { getEntries, isInstalled } = require('../libs/utils')
const { splitSNC } = require('../libs/hybrid')
const paths = config.paths
const tsImportPluginFactory = require('ts-import-plugin')

const isProd = process.env.NODE_ENV === 'production'
const maraConf = require(paths.marauder)
const shouldUseSourceMap = isProd && !!maraConf.sourceMap

let tsImportLibs = []
if (maraConf.tsImportLibs) {
  if (Array.isArray(maraConf.tsImportLibs)) {
    tsImportLibs = tsImportLibs.concat(maraConf.tsImportLibs)
  } else {
    throw Error('marauder.config.js中的tsImportLibs必须是Array类型！')
  }
}

module.exports = function(entry, type) {
  const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
  const { styleLoaders } = require('./loaders/style-loader')
  const {
    babelLoader,
    babelExternalMoudles
  } = require('./loaders/babel-loader')
  const isLib = entry == '__LIB__'
  const ASSETS = isLib ? '' : config.assetsDir
  const entryGlob = `src/view/${entry}/index.@(ts|js)`
  const { vueRuntimeOnly } = config.compiler
  const isHybridMode = config.build.env.raw['jsbridgeBuildType'] === 'app'
  const isDevOrBuildCmd = type === 'dev' || type === 'build'
  let entryConf = {}
  let externals = []

  const shouldSNCHoisting =
    isDevOrBuildCmd &&
    isHybridMode &&
    config.compiler.splitSNC &&
    isInstalled('@mfelibs/universal-framework')

  // hybrid SDK 提升，以尽快建立 jsbridge
  if (shouldSNCHoisting) {
    const sncConf = splitSNC(entryGlob)

    // 使用拆分后的 entry 配置
    entryConf = sncConf.entry
    externals.push(...sncConf.externals)
  } else {
    entryConf = getEntries(entryGlob, require.resolve('./polyfills'))
  }

  const baseConfig = {
    // dev, build 环境依赖 base.entry，务必提供
    entry: entryConf,
    output: {
      path: paths.dist,
      // 统一使用 POSIX 风格拼接路径
      // webpack 将会处理平台差异
      // 如果使用 path.join 在 Windows 上会出现路径异常
      filename: path.posix.join(ASSETS, 'js/[name].js'),
      chunkFilename: path.posix.join(ASSETS, 'js/[name].async.js')
    },
    resolve: {
      // disable symlinks
      symlinks: false,
      // js first
      extensions: [
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.sn',
        '.vue',
        '.json',
        '.mjs'
      ],
      // https://doc.webpack-china.org/configuration/resolve/#resolve-mainfields
      // source 为自定义拓展属性，表示源码入口
      mainFields: ['source', 'browser', 'module', 'main'],
      modules: ['node_modules'],
      alias: {
        // 使用 `~` 作为 src 别名
        // 使用特殊符号防止与 npm 包冲突
        // import '~/css/style.css'
        '~': paths.src,
        vue$: `vue/dist/vue${vueRuntimeOnly ? '.runtime' : ''}.esm.js`,
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
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        // 为了兼容  bundle-loader 暂时不启用
        // { parser: { requireEnsure: false } },
        {
          oneOf: [
            ...styleLoaders({
              sourceMap: shouldUseSourceMap,
              extract: isProd && type !== 'mc',
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
            {
              test: /\.mustache$/,
              loader: 'mustache-loader'
            },
            // Process JS with Babel.
            babelLoader(isProd),
            {
              test: /\.tsx?$/,
              // require.resolve 将会检查模块是否存在
              // ts-loader 为可选配置，所以这里不使用 require.resolve
              loader: 'ts-loader',
              include: babelExternalMoudles,
              options: {
                appendTsSuffixTo: [/\.vue$/],
                transpileOnly: true,
                getCustomTransformers: () => ({
                  before: [tsImportPluginFactory(tsImportLibs)]
                }),
                compilerOptions: {
                  module: 'ESNext'
                }
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
              // Exclude `js` files to keep "css" loader working as it injects
              // it's runtime that would otherwise processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              loader: 'file-loader',
              exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
              options: {
                name: path.posix.join(ASSETS, 'media/[name].[hash:8].[ext]')
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
            }
          ]
        }
      ]
    },
    plugins: [],
    externals: externals,
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

  if (isHybridMode) {
    const { SinaHybridPlugin } = require('../libs/hybrid')

    // 确保在 copy Files 之前
    baseConfig.plugins.push(
      new SinaHybridPlugin({
        entry: entry,
        splitSNC: shouldSNCHoisting
      })
    )
  }

  return baseConfig
}
