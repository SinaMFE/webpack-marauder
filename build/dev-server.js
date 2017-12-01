process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

const config = require('./config')
const chalk = require('chalk')
const { getFreePort, localIp, rootPath } = require('./utils/utils')
const { entry } = require('./utils/entry')

// 是否为交互模式
const isInteractive = process.stdout.isTTY

const path = require('path')
const webpack = require('webpack')
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware')
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware')
const clearConsole = require('react-dev-utils/clearConsole')
const openBrowser = require('react-dev-utils/openBrowser')
const DevServer = require('webpack-dev-server')
const webpackConfig = require('./webpack/webpack.dev.conf')
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || config.dev.port
const HOST = localIp()

// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

async function createCompiler(port) {
  const uri = `http://${HOST || 'localhost'}:${port}`
  const compiler = webpack(webpackConfig)
  let isFirstCompile = true

  compiler.plugin('done', stats => {
    const messages = stats.toJson({}, true)

    if (isFirstCompile) {
      console.log(`> Listening at ${uri}\n`)
      isFirstCompile = false
    }

    // If errors exist, only show errors.
    if (messages.errors.length) return
  })

  // 为每一个入口文件添加 webpack-dev-server 客户端
  Object.keys(webpackConfig.entry).forEach(key => {
    // client 在业务模块之前引入，以捕获初始化错误
    ;[].unshift.apply(webpackConfig.entry[key], [
      require.resolve('react-dev-utils/webpackHotDevClient')
      // require.resolve('webpack-dev-server/client') + '?/',
      // require.resolve('webpack/hot/dev-server')
    ])
  })

  return compiler
}

async function createDevServer(port) {
  const pagePublicDir = rootPath(`${config.paths.page}/${entry}/public`)
  const compiler = await createCompiler(port)

  return new DevServer(compiler, {
    disableHostCheck: !proxyTable,
    // 开启 gzip 压缩
    compress: true,
    // 屏蔽 WebpackDevServer 自身的日志输出
    // 此设置不影响警告与错误信息
    clientLogLevel: 'none',
    // 注意，不要通过 webpack import public 内的资源
    // 对于脚本及样式，应使用 script，link 标签引入
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // 在 js 内，可使用 process.env.PUBLIC 获取路径
    contentBase: [config.paths.public, pagePublicDir],
    // 监听 public 文件夹内容变化
    watchContentBase: true,
    // 开启服务器热更新. 它将为 WebpackDevServer 客户端注入 /sockjs-node/ 节点
    // 从而能够感知文件何时被更新。WebpackDevServer 客户端将会被添加到 Webpack 开发配置
    // 的入口中。 注意，目前只有 css 能够热更新，js 的改动依然会触发浏览器刷新
    hot: true,
    // 指定资源根路径，开发环境默认为 /.
    publicPath: webpackConfig.output.publicPath,
    // WebpackDevServer 的默认输出会有很多干扰项，所以我们使用自定义信息代替
    quiet: true,
    // 据说这么做在某些系统上能避免 CPU 过载。
    // https://github.com/facebookincubator/create-react-app/issues/293
    // src/node_modules 不被忽略以支持使用绝对路径导入
    // https://github.com/facebookincubator/create-react-app/issues/1065
    watchOptions: {
      ignored: new RegExp(
        `^(?!${path
          .normalize(config.paths.src + '/')
          .replace(/[\\]+/g, '\\\\')}).+[\\\\/]node_modules[\\\\/]`,
        'g'
      )
    },
    // 开启 HTTPS
    https: false,
    host: HOST || '0.0.0.0',
    overlay: false,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebookincubator/create-react-app/issues/387.
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
  })
}

async function start() {
  const port = await getFreePort(DEFAULT_PORT)
  const devServer = await createDevServer(port)
  ;['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close()
      process.exit()
    })
  })

  return devServer.listen(port, HOST, err => {
    const uri = `http://${HOST || 'localhost'}:${port}`
    let publicDevPath = config.dev.assetsPublicPath

    if (err) return console.log(err)

    // 交互模式下清除 console
    isInteractive && clearConsole()

    // 以绝对路径 / 开头时，加入 url 中在浏览器打开
    // 以非 / 开头时，回退为 /，避免浏览器路径错乱
    publicDevPath = publicDevPath.startsWith('/') ? publicDevPath : '/'

    console.log('> Starting dev server...')
    openBrowser(`${uri + publicDevPath + entry}.html`)
  })
}

start()
