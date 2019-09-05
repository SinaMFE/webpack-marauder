'use strict'

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', err => {
  throw err
})

const config = require('../config')
const { getFreePort } = require('../libs/utils')
const getEntry = require('../libs/entry')
const maraConf = require(config.paths.marauder)
const clearConsole = require('react-dev-utils/clearConsole')

// 是否为交互模式
const isInteractive = process.stdout.isTTY

const webpack = require('webpack')
const getWebpackConfig = require('../webpack/webpack.dev.conf')
const prehandleConfig = require('../libs/prehandleConfig')
const progressHandler = require('../libs/buildProgress')
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || config.dev.port
const PROTOCOL = maraConf.https === true ? 'https' : 'http'

// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

function getCompiler(webpackConf, { entry, port } = {}) {
  const openBrowser = require('react-dev-utils/openBrowser')
  const hostUri = getServerHostUri(webpackConf.devServer.host, port)
  let isFirstCompile = true

  // 为每一个入口文件添加 webpack-dev-server 客户端
  addHotDevClient(webpackConf.entry)

  const compiler = webpack(webpackConf)

  compiler.apply(
    new webpack.ProgressPlugin((...args) => {
      if (isFirstCompile) progressHandler.apply(null, args)
    })
  )

  compiler.plugin('after-emit', (compilation, callback) => {
    if (isFirstCompile) {
      // 交互模式下清除 console
      isInteractive && clearConsole()
    }
    callback()
  })

  compiler.plugin('done', stats => {
    const messages = stats.toJson({}, true)

    // If errors exist, only show errors.
    if (messages.errors.length) return

    if (isFirstCompile) {
      console.log(`> Listening at ${hostUri}\n`)
      openBrowser(getServerURL(hostUri, entry))
      isFirstCompile = false
    }
  })

  return compiler
}

function addHotDevClient(entryConf) {
  Object.keys(entryConf).forEach(entry => {
    // client 在业务模块之前引入，以捕获初始化错误
    entryConf[entry] = [
      require.resolve('react-dev-utils/webpackHotDevClient')
    ].concat(entryConf[entry])
  })
}

function createDevServer(webpackConf, opt) {
  const DevServer = require('webpack-dev-server')
  const serverConf = webpackConf.devServer
  const compiler = getCompiler(webpackConf, opt)

  serverConf.https = PROTOCOL === 'https'
  // 安全原因，一般禁用 HostCheck
  // https://github.com/webpack/webpack-dev-server/issues/887
  serverConf.disableHostCheck = !proxyTable

  return new DevServer(compiler, serverConf)
}

function getServerHostUri(host, port) {
  return `${PROTOCOL}://${host || 'localhost'}:${port}`
}

function getServerURL(hostUri, entry) {
  let publicDevPath = config.dev.assetsPublicPath

  // 以绝对路径 / 开头时，加入 url 中在浏览器打开
  // 以非 / 开头时，回退为 /，避免浏览器路径错乱
  publicDevPath = publicDevPath.startsWith('/') ? publicDevPath : '/'

  return `${hostUri + publicDevPath + entry}.html`
}

async function server(entryInput) {
  console.log('> Starting development server...')

  const webpackConf = prehandleConfig('dev', getWebpackConfig(entryInput))
  const port = await getFreePort(DEFAULT_PORT)
  const devServer = createDevServer(webpackConf, {
    entry: entryInput.entry,
    port
  })
  // Ctrl + C 触发
  ;['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close()
      process.exit()
    })
  })

  // 指定 listen host 0.0.0.0 允许来自 ip 或 localhost 的访问
  return devServer.listen(port, '0.0.0.0', err => {
    if (err) return console.log(err)
  })
}

module.exports = args => {
  return getEntry(args).then(server)
}
