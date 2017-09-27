const webpack = require('webpack')
const merge = require('webpack-merge')
const ZipPlugin = require('zip-webpack-plugin')
const BabiliPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const marauderDebug = require('sinamfe-marauder-debug')
const ensure_ls = require('sinamfe-marauder-ensure-ls')
const webpackHttps = require('sinamfe-webpack-https')
const moduleDependency = require('sinamfe-webpack-module_dependency')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const baseWebpackConfig = require('./webpack.base.conf')
const config = require('./config')
const utils = require('./utils')

const cwd = process.cwd()
const CopyResourceList = []
const marauderConfig = utils.getProjectConf()

marauderConfig.resourcePath &&
  marauderConfig.resourcePath.forEach(function(item) {
    CopyResourceList.push({
      from: utils.rootPath(item),
      to: 'resource'
    })
  })

const env = config.build.env
const entryName = process.argus[0]
CopyResourceList.push({
  from: process.cwd() + '/package.json',
  to: 'package.json'
})

if (!process.argus[0]) {
  console.log(
    '\x1B[41m%s\x1B[49m',
    '错误：请传入对应页面名称，如果是嵌套页面则传递view下相对路径，目前不支持工程打包！'
  )
  throw new Error('请传入对应页面名称，如果是嵌套页面则传递view下相对路径，目前不支持工程打包！')
}

let configvendor = marauderConfig.vendor
if (configvendor == null || configvendor.length == 0) {
  configvendor = {}
} else {
  configvendor = {
    vendor: configvendor
  }
}

const webpackConfig = merge(baseWebpackConfig, {
  entry: Object.assign(configvendor, baseWebpackConfig.entry),
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true
    })
  },
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  output: {
    path: config.build.assetsRoot + '/' + entryName,
    filename: marauderConfig.hash
      ? utils.assetsPath('[name].[chunkhash:8].min.js')
      : utils.assetsPath('[name].min.js'),
    publicPath: marauderConfig.publicPath || '',
    chunkFilename: '[name].[chunkhash:8].chunk.js'
  },
  plugins: [
    new moduleDependency(),
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new ExtractTextPlugin({
      filename: marauderConfig.hash
        ? utils.assetsPath('[name].[chunkhash:8].min.css')
        : utils.assetsPath('[name].min.css')
    }),
    new OptimizeCssAssetsPlugin({
      cssProcessor: require('cssnano'),
      // cssnano 中自带 autoprefixer，在压缩时会根据配置去除无用前缀
      // 为保持统一，将其禁用，在 4.0 版本后将会默认禁用
      // safe: true 禁止计算 z-index
      cssProcessorOptions: { autoprefixer: false, safe: true },
      canPrint: false // 不显示通知
    }),
    new CopyWebpackPlugin(CopyResourceList)
  ].concat(
    Object.keys(baseWebpackConfig.entry).map(function(name) {
      // 每个页面生成一个html
      return new HtmlWebpackPlugin({
        // 生成出来的html文件名
        filename: utils.rootPath(`dist/${name}/index.html`),
        // 每个html的模版，这里多个页面使用同一个模版
        template: `html-withimg-loader?min=false!${cwd}/src/view/${name}/index.html`,
        minify: false,
        // 自动将引用插入html
        inject: true,
        // 每个html引用的js模块，也可以在这里加上vendor等公用模块
        chunks: [name]
      })
    })
  )
})

if (
  (marauderConfig.vendor == null || marauderConfig.vendor.length == 0) == false
) {
  webpackConfig.plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    })
  )
}

if (marauderConfig.ensurels && marauderConfig.ensurels == true) {
  webpackConfig.plugins.push(new ensure_ls())
}

// 该顺序是为了让 webpackhttps先执行，babliplugin后执行
if (marauderConfig.https) {
  webpackConfig.plugins.push(new webpackHttps())
}

webpackConfig.plugins.push(new marauderDebug())
webpackConfig.plugins.push(new BabiliPlugin())

// 由于 marauderDebug 引起的 bug 必须再次导入 BannerPlugin
webpackConfig.plugins.push(
  new webpack.BannerPlugin({
    banner: utils.banner(), // 其值为字符串，将作为注释存在
    entryOnly: true // 如果值为 true，将只在入口 chunks 文件中添加
  })
)

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')
  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' + config.build.productionGzipExtensions.join('|') + ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

// bundle 大小分析
if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

if (marauderConfig.zip == true) {
  webpackConfig.plugins.push(
    new ZipPlugin({
      // OPTIONAL: defaults to the Webpack output path (above)
      // can be relative (to Webpack output path) or absolute
      path: './',
      // OPTIONAL: defaults to the Webpack output filename (above) or,
      // if not present, the basename of the path
      filename: process.argus[0],
      // OPTIONAL: defaults to 'zip'
      // the file extension to use instead of 'zip'
      extension: 'zip',
      // OPTIONAL: defaults an empty string
      // the prefix for the files included in the zip file
      pathPrefix: '',
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

module.exports = webpackConfig
