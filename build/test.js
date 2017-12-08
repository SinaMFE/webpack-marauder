'use strict'

// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

const fs = require('fs-extra')
const chalk = require('chalk')
const { entry, ftpBranch } = require('./utils/entry')

const ora = require('ora')
const webpack = require('webpack')
const ftpUpload = require('./utils/ftp')
const config = require('./config')
const paths = config.paths
const webpackConfig = require('./webpack/webpack.prod.conf')(entry)
const maraConf = require(paths.marauder)
const printBuildError = require('react-dev-utils/printBuildError')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const VERSION = process.env.npm_package_version

const spinner = ora('building for production...')
spinner.start()

function build() {
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

fs.emptyDirSync(
  paths.dist + (config.keyword.UMDCOMPILE == entry ? '' : '/' + entry)
)

build()
  .then(output => {
    // webpack 打包结果统计
    process.stdout.write(
      output.stats.toString({
        colors: true,
        modules: false,
        children: false,
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
  })
  .then(() => {
    // ftp upload
    if (config.build.uploadFtp) {
      ftpUpload(entry, ftpBranch)
    }
  })
  .catch(err => {
    console.log(chalk.red('Failed to compile.\n'))
    printBuildError(err)
    process.exit(1)
  })
