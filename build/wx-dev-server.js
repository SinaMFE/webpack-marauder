'use strict'

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', err => {
  throw err
})

var config = require('../config')
var utils = require('../libs/utils')
var path = require('path')
var express = require('express')
var getEntry = require('../libs/wx-entry')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var getWebpackConfig = require('../webpack/webpack.wx-dev.conf')
var prehandleConfig = require('../libs/prehandleConfig')
var DEFAULT_PORT = parseInt(process.env.PORT, 10) || config.dev.port

var isInteractive = process.stdout.isTTY
var proxyTable = config.dev.proxyTable

async function server(entryInput) {
  console.log('> Starting development server...')

  const webpackConfig = prehandleConfig('dev', getWebpackConfig(entryInput))
  const port = await utils.getFreePort(DEFAULT_PORT)
  const app = express()
  const compiler = webpack(webpackConfig)

  Object.keys(proxyTable).forEach(function(context) {
    var options = proxyTable[context]
    if (typeof options === 'string') {
      options = {
        target: options
      }
    }
    app.use(proxyMiddleware(options.filter || context, options))
  })

  // handle fallback for HTML5 history API
  app.use(require('connect-history-api-fallback')())

  app.use('/static', express.static('./static'))

  var server = app.listen(port, 'localhost')

  require('webpack-dev-middleware-hard-disk')(compiler, {
    publicPath: '/',
    quiet: true
  });

  ['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      server.close()
      process.exit()
    })
  })
}


getEntry().then(server)
