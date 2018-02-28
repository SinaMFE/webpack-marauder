'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware')
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware')
const ignoredFiles = require('react-dev-utils/ignoredFiles')
const { localIp, getChunks, rootPath } = require('../libs/utils')
const config = require('../config')

function parseChunks(entry) {
  const chunkObj = getChunks(`src/view/${entry}/index.*.js`)
  const chunks = [].concat(...Object.values(chunkObj))

  return { [entry]: chunks }
}

module.exports = function({ entry }) {
  const baseWebpackConfig = require('./webpack.base.conf')(entry)
  const pagePublicDir = rootPath(`${config.paths.page}/${entry}/public`)
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
    devServer: {
      headers: { 'Access-Control-Allow-Origin': '*' },
      // 开启 gzip 压缩
      compress: true,
      // 屏蔽 WebpackDevServer 自身的日志输出
      // 此设置不影响警告与错误信息
      clientLogLevel: 'none',
      // 注意，不要通过 webpack import public 内的资源
      // 对于脚本及样式，应使用 script，link 标签引入
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // 在 js 内，可使用 process.env.PUBLIC 获取路径
      contentBase: [
        config.paths.public,
        pagePublicDir
        // @FIXME 监听 html 文件变化，临时措施
        // `${config.paths.page}/${entry}/*.html`
      ],
      // 监听 public 文件夹内容变化
      watchContentBase: true,
      // 开启服务器热更新. 它将为 WebpackDevServer 客户端注入 /sockjs-node/ 节点
      // 从而能够感知文件何时被更新。WebpackDevServer 客户端将会被添加到 Webpack 开发配置
      // 的入口中。 注意，目前只有 css 能够热更新，js 的改动依然会触发浏览器刷新
      hot: true,
      // 指定资源根路径.
      publicPath: config.dev.assetsPublicPath,
      // WebpackDevServer 的默认输出会有很多干扰项，所以我们使用自定义信息代替
      quiet: true,
      // 据说这么做在某些系统上能避免 CPU 过载。
      // https://github.com/facebookincubator/create-react-app/issues/293
      // src/node_modules 不被忽略以支持使用绝对路径导入
      // https://github.com/facebook/create-react-app/issues/1065
      watchOptions: {
        ignored: ignoredFiles(config.paths.src)
      },
      host: localIp(),
      overlay: false,
      historyApiFallback: {
        // Paths with dots should still use the history fallback.
        // See https://github.com/facebook/create-react-app/issues/387.
        disableDotRule: true
      },
      // public: allowedHost,
      // proxy,
      before(app) {
        // This lets us open files from the runtime error overlay.
        app.use(errorOverlayMiddleware())
        // This service worker file is effectively a 'no-op' that will reset any
        // previous service worker registered for the same host:port combination.
        // We do this in development to avoid hitting the production cache if
        // it used the same host and port.
        // https://github.com/facebookincubator/create-react-app/issues/2272#issuecomment-302832432
        app.use(noopServiceWorkerMiddleware())
      }
    },
    plugins: [
      new webpack.DefinePlugin(config.dev.env.stringified),
      // 替换 html 内的环境变量
      // %PUBLIC% 转换为具体路径
      // 在 dev 环境下为空字符串
      new InterpolateHtmlPlugin(config.dev.env.raw),
      new webpack.NamedModulesPlugin(),
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
        template: `html-withimg-loader?min=false!${
          config.paths.page
        }/${entry}/index.html`,
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
