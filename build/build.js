'use strict'

// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

process.on('unhandledRejection', err => {
  throw err
})

const fs = require('fs-extra')
const chalk = require('chalk')
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

const spinner = ora('building for production...')
let entryInput = null

function build() {
  const webpackConfig = getWebpackConfig(entryInput)
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
        warnings: messages.warnings
      })
    })
  })
}

function clean() {
  return fs.emptyDir(paths.dist + '/' + entryInput.entry)
}

function ftp() {
  // ftp upload
  return (
    config.build.uploadFtp && ftpUpload(entryInput.entry, entryInput.ftpBranch)
  )
}

function success(output) {
  // webpack 打包结果统计
  process.stdout.write(
    output.stats.toString({
      hash: false,
      colors: true,
      modules: false,
      children: false, // if you are using ts-loader, setting this to true will make typescript errors show up during build
      chunks: false,
      chunkModules: false
    }) + '\n\n'
  )

  console.log(chalk.cyan('  Build complete.\n'))

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
