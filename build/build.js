'use strict'

// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

process.on('unhandledRejection', err => {
  throw err
})

const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const ora = require('ora')
const webpack = require('webpack')
const getEntry = require('../libs/entry')
const ftpUpload = require('../libs/ftp')
const config = require('../config')
const paths = config.paths
const getWebpackConfig = require('../webpack/webpack.prod.conf')
const maraConf = require(paths.marauder)
const printBuildError = require('react-dev-utils/printBuildError')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const VERSION = process.env.npm_package_version
const Hybrid = require('../libs/hybrid')
const buildReporter = require('../libs/buildReporter')
const prehandleConfig = require('../libs/prehandleConfig')

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const spinner = ora('building for production...')
let entryInput = null

function build(dist) {
  let webpackConfig = getWebpackConfig(entryInput)
  webpackConfig = prehandleConfig('build', webpackConfig)
  const compiler = webpack(webpackConfig)

  compiler.plugin('compilation', compilation => {
    if (!maraConf.hybrid) return

    const hyConf = Object.assign({}, config, maraConf.hybrid)
    const hyVersionFile = ''

    compilation.assets[VERSION] = {
      source: () => hyVersionFile,
      size: () => hyVersionFile.length
    }
  })

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
        dist,
        warnings: messages.warnings
      })
    })
  })
}

function clean() {
  const dist = path.join(paths.dist, entryInput.entry)
  return fs.emptyDir(dist).then(() => dist)
}

function ftp() {
  // ftp upload
  return (
    config.build.uploadFtp && ftpUpload(entryInput.entry, entryInput.ftpBranch)
  )
}

function success(output) {
  console.log(chalk.green('Build complete.\n'))
  console.log('File sizes after gzip:\n')

  const stats = output.stats.toJson({
    chunks: false,
    modules: false,
    chunkModules: false
  })

  buildReporter(
    stats,
    {
      distDir: output.dist,
      entry: entryInput.entry
    },
    WARN_AFTER_BUNDLE_GZIP_SIZE,
    WARN_AFTER_CHUNK_GZIP_SIZE
  )

  console.log()
  console.log(
    chalk.yellow(
      `  Tip: built files are meant to be served over an HTTP server.\n  Opening index.html over file:// won't work.\n`
    )
  )
}

async function hybrid(remotePath) {
  if (!maraConf.hybrid || !config.build.uploadFtp) return

  const { entry, ftpBranch } = entryInput
  const hybridInstance = new Hybrid({ entry, ftpBranch, remotePath })

  return hybridInstance.changeHybridConfig()
}

function error(err) {
  console.log(chalk.red('Failed to compile.\n'))
  printBuildError(err)
  process.exit(1)
}

function setup(entry) {
  entryInput = entry
  spinner.start()
}

getEntry()
  .then(setup)
  .then(clean)
  .then(build)
  .then(success)
  .then(ftp)
  .then(hybrid)
  .catch(error)
