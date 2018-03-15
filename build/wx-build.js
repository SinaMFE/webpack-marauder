'use strict'
// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

process.on('unhandledRejection', err => {
  throw err
});

var ora = require('ora')
var fs = require('fs-extra')
var path = require('path')
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
var buildReporter = require('../libs/buildReporter')
var config = require('../config')
var paths = config.paths
var chalk = require('chalk')
var webpack = require('webpack')
var getEntry = require('../libs/wx-entry')
var printBuildError = require('../libs/printBuildError')
var getWebpackConfig = require('../webpack/webpack.wx-prod.conf')
var prehandleConfig = require('../libs/prehandleConfig')

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

var spinner = ora('building for production...')
let entryInput = null

function setup(entry) {
  entryInput = entry
  spinner.start()
}

function clean() {
  const dist = paths['wx-dist'];
  return fs.emptyDir(dist).then(() => dist)
}

function build(dist) {
	let webpackConfig = getWebpackConfig(entryInput);
  webpackConfig = prehandleConfig('wx-build', webpackConfig)
  const compiler = webpack(webpackConfig)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      spinner.stop()

      if (err) return reject(err)

      const messages = formatWebpackMessages(stats.toJson({}, true))
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1
        }
        return reject(new Error(messages.errors.join('\n\n')))
      }

      return resolve({
        stats,
        publicPath: webpackConfig.output.publicPath,
        path: webpackConfig.output.path,
        warnings: messages.warnings
      })
    })
  })
}

function success(output){
  const stats = output.stats.toJson({
    hash: false,
    chunks: false,
    modules: false,
    chunkModules: false
  })

  console.log(chalk.green(`Build complete in ${stats.time}ms\n`))
  console.log('File sizes after gzip:\n')

  stats.assets['__dist'] = output.path

  buildReporter(
    // page 为数组
    { page: [stats.assets] },
    WARN_AFTER_BUNDLE_GZIP_SIZE,
    WARN_AFTER_CHUNK_GZIP_SIZE
  )

  console.log()

  if (output.publicPath === '/') {
    console.log(
      chalk.yellow(
        `The app is built assuming that it will be deployed at the root of a domain.`
      )
    )
    console.log(
      chalk.yellow(
        `If you intend to deploy it under a subpath, update the ${chalk.green(
          'publicPath'
        )} option in your project config (${chalk.cyan(
          `marauder.config.js`
        )}).\n`
      )
    )
  }
}

function error(err){
	console.log(err);
  console.log(chalk.red('Failed to compile1.\n'))
  printBuildError(err)
  process.exit(1)
}

getEntry()
  .then(setup)
  .then(clean)
  .then(build)
	.then(success)
	.catch(error)
