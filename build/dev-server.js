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

console.log('> Starting development server...')

const webpack = require('webpack')
const openBrowser = require('react-dev-utils/openBrowser')
const DevServer = require('webpack-dev-server')
const prehandleConfig = require('../libs/prehandleConfig')
const getWebpackConfig = require('../webpack/webpack.dev.conf')
const progressHandler = require('../libs/buildProgress')
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || config.dev.port
const PROTOCOL = maraConf.https === true ? 'https' : 'http'

// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

async function getCompiler(webpackConf, { entry, port } = {}) {
  const hostUri = getServerHostUri(webpackConf.devServer.host, port)
  const compiler = webpack(webpackConf)
  let lineCaretPosition = 0
  let isFirstCompile = true

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

  // 为每一个入口文件添加 webpack-dev-server 客户端
  Object.values(webpackConf.entry).forEach(addHotDevClient)

  return compiler
}

function addHotDevClient(entry) {
  // client 在业务模块之前引入，以捕获初始化错误
  ;[].unshift.apply(entry, [
    require.resolve('react-dev-utils/webpackHotDevClient')
    // require.resolve('webpack-dev-server/client') + '?/',
    // require.resolve('webpack/hot/dev-server')
  ])
}

async function createDevServer(webpackConf, opt) {
  const serverConf = webpackConf.devServer
  const compiler = await getCompiler(webpackConf, opt)

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
  const webpackConf = prehandleConfig('dev', getWebpackConfig(entryInput))
  const port = await getFreePort(DEFAULT_PORT)
  const devServer = await createDevServer(webpackConf, {
    entry: entryInput.entry,
    port
  })
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

getEntry().then(server)
