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
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const Hybrid = require('../libs/hybrid')
const printBuildError = require('../libs/printBuildError')
const buildReporter = require('../libs/buildReporter')
const prehandleConfig = require('../libs/prehandleConfig')
const VERSION = process.env.npm_package_version

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
    genHybridVer(compilation)
    genBuildJson(compilation)
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
        publicPath: webpackConfig.output.publicPath,
        path: webpackConfig.output.path,
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
  console.log(
    `The ${chalk.cyan(
      'dist/' + entryInput.entry
    )} directory is ready to be deployed.\n`
  )

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

function genHybridVer(compilation) {
  if (!maraConf.hybrid) return

  const hyConf = Object.assign({}, config, maraConf.hybrid)
  const hyVersionFile = ''

  compilation.assets[VERSION] = {
    source: () => hyVersionFile,
    size: () => hyVersionFile.length
  }
}

function genBuildJson(compilation) {
  const source = JSON.stringify({
    target: process.env.jsbridgeBuildType === 'app' ? 'app' : 'wap'
  })

  compilation.assets['build.json'] = {
    source: () => source,
    size: () => source.length
  }
}

getEntry()
  .then(setup)
  .then(clean)
  .then(build)
  .then(success)
  .then(ftp)
  .then(hybrid)
  .catch(error)
