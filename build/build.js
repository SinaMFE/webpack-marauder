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
const { uploadDir } = require('../libs/ftp')
const config = require('../config')
const paths = config.paths
const getWebpackConfig = require('../webpack/webpack.prod.conf')
const maraConf = require(paths.marauder)
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const { hybridDevPublish, hybridTestPublish } = require('../libs/hybrid')
const printBuildError = require('../libs/printBuildError')
const buildReporter = require('../libs/buildReporter')
const prehandleConfig = require('../libs/prehandleConfig')

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const spinner = ora('building for production...')

function build({ entryInput, dist }) {
  let webpackConfig = getWebpackConfig(entryInput)
  webpackConfig = prehandleConfig('build', webpackConfig)
  const compiler = webpack(webpackConfig)

  compiler.plugin('compilation', compilation => {
    // genHybridVer(compilation)
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
        entryInput,
        stats,
        publicPath: webpackConfig.output.publicPath,
        outputPath: webpackConfig.output.path,
        warnings: messages.warnings
      })
    })
  })
}

function clean(entryInput) {
  const dist = path.join(paths.dist, entryInput.entry)

  return fs.emptyDir(dist).then(() => ({
    entryInput,
    dist
  }))
}

function success({ entryInput, stats, publicPath, outputPath }) {
  const result = stats.toJson({
    hash: false,
    chunks: false,
    modules: false,
    chunkModules: false
  })

  console.log(chalk.green(`Build complete in ${result.time}ms\n`))
  console.log('File sizes after gzip:\n')

  result.assets['__dist'] = outputPath

  buildReporter(
    // page 为数组
    { page: [result.assets] },
    WARN_AFTER_BUNDLE_GZIP_SIZE,
    WARN_AFTER_CHUNK_GZIP_SIZE
  )

  console.log()
  console.log(
    `The ${chalk.cyan(
      'dist/' + entryInput.entry
    )} directory is ready to be deployed.\n`
  )

  if (publicPath === '/') {
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

  return entryInput
}

async function deploy({ entry, ftpBranch, entryArgs, remotePath }) {
  if (maraConf.hybrid && remotePath) {
    await hybridDevPublish(entry, remotePath)
  } else if (entryArgs.test !== null) {
    await hybridTestPublish(entry, entryArgs.test)
  }
}

function error(err) {
  console.log(chalk.red('\n🕳   Failed to compile.\n'))
  printBuildError(err)
  process.exit(1)
}

function genBuildJson(compilation) {
  const source = JSON.stringify({
    debug: maraConf.debug || process.env.MARA_compileModel == 'dev',
    target: process.env.jsbridgeBuildType === 'app' ? 'app' : 'web'
  })

  compilation.assets['build.json'] = {
    source: () => source,
    size: () => source.length
  }
}

function ftp({ entry, entryArgs, ftpBranch }) {
  if (ftpBranch === null)
    return {
      entry,
      entryArgs,
      ftpBranch
    }

  return uploadDir(entry, ftpBranch).then(remotePath => ({
    entry,
    ftpBranch,
    entryArgs,
    remotePath
  }))
}

function setup(entryInput) {
  spinner.start()

  return entryInput
}

// finally fn
function done() {
  const date = new Date()
  const hour = date.getHours()

  hour > 21 && console.log(chalk.magenta('🚜  marauder loves you'))
}

module.exports = args => {
  return getEntry(args)
    .then(setup)
    .then(clean)
    .then(build)
    .then(success)
    .then(ftp)
    .then(deploy)
    .then(done)
    .catch(error)
}
