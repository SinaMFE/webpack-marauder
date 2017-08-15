const config = require('./config.js')
const { getFreePort, localIp, getPageList } = require('./utils.js')
const argv = require('yargs').argv

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

process.argus = process.argv.splice(2)

const opn = require('opn')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const webpackConfig = require('./webpack.dev.conf')
// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
const autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

const app = express()
const compiler = webpack(webpackConfig)

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})

// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function(compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function(data, cb) {
    console.log('full load')
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function(context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
// var staticPath = path.posix.join(
//   config.dev.assetsPublicPath,
//   config.dev.assetsSubDirectory
// )

// app.use('/static', exp ress.static(__dirname + '/public'));

// var iplist = []
// var os = require('os')
// var ifaces = os.networkInterfaces()
// for (var dev in ifaces) {
//   var alias = 0

//   ifaces[dev].forEach(function(details) {
//     if (details.family == 'IPv4') {
//       iplist.push(details.address)
//       ++alias
//     }
//   })
// }

// // app.use('/static', exp ress.static(__dirname + '/public'));
// app.use(express.static(process.cwd() + '/src'))
// var uri
// if (iplist[0] == '127.0.0.1') {
//   uri = 'http://' + (iplist[1] || 'localhost') + ':' + port
// } else {
//   uri = 'http://' + (iplist[0] || 'localhost') + ':' + port
// }

// 路由
// app.get('/:viewname?', function(req, res, next) {
//  var viewname = req.params.viewname ? req.params.viewname + '.html' : 'index.html';
//  var filepath = path.join(compiler.outputPath, viewname);
//  console.log(filepath)
//  // 使用webpack提供的outputFileSystem
//  compiler.outputFileSystem.readFile(filepath, function(err, result) {
//      if (err) {
//          // something error
//          return next(err);
//      }
//      res.set('content-type', 'text/html');
//      res.send(result);
//      res.end();
//  });
// });

let _resolve
const readyPromise = new Promise(resolve => {
  _resolve = resolve
})

async function start() {
  const port = await getFreePort()
  const uri = `http://${localIp() || 'localhost'}:${port}`
  const pages = getPageList()
  const entry =
    process.argus[0] || (pages.includes('index') ? 'index' : pages[0])

  console.log('> Starting dev server...')
  devMiddleware.waitUntilValid(function() {
    console.log(`> Listening at ${uri}\n`)
  })

  return app.listen(port, function(err) {
    if (err) return console.log(err)

    // when env is testing, don't need open it
    if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
      // 指定 option.wait，退出进程
      opn(`${uri}/${entry}.html`, { wait: false })
    }

    _resolve()
  })
}

const server = start()

module.exports = {
  ready: readyPromise,
  close() {
    server.close()
  }
}
