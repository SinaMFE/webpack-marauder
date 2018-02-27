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
const { getPageList } = require('../libs/utils')
const config = require('../config')
const paths = config.paths
const maraConf = require(paths.marauder)
const getWebpackProdConf = require('../webpack/webpack.prod.conf')
const getWebpackLibConf = require('../webpack/webpack.lib.conf')
const printBuildError = require('react-dev-utils/printBuildError')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const buildReporter = require('../libs/buildReporter')
const prehandleConfig = require('../libs/prehandleConfig')

const spinner = ora('Biuld component...')
spinner.start()

const pages = getPageList(config.paths.entries)
const dists = {
  distDir: paths.dist,
  libDir: paths.lib
}
const targets = [
  {
    format: 'commonjs2',
    filename: 'index.cjs.js'
  },
  {
    format: 'umd',
    filename: 'index.min.js',
    minify: true
  },
  {
    format: 'umd',
    filename: 'index.js'
  }
]

const webpackConfs = targets
  .map(library => {
    const libConf = getWebpackLibConf(library)
    // 可在 stats.children[0].publicPath 获取
    libConf.output.publicPath = `__LIB__${library.format}`
    return libConf
  })
  .concat(pages.map(entry => getWebpackProdConf({ entry })))

function write(dest, code) {
  return new Promise((resolve, reject) => {
    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function build(dists) {
  // @TODO 多配置应用 prehandleConfig
  // const webpackConfig = prehandleConfig('lib', webpackConfig);
  const compiler = webpack(webpackConfs)

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
        dists,
        warnings: messages.warnings
      })
    })
  })
}

function clean(dists) {
  const distArr = Object.values(dists)

  return Promise.all(distArr.map(dir => fs.emptyDir(dir))).then(() => dists)
}

function success(output) {
  console.log(chalk.green('Build complete.\n'))
  console.log('File sizes after gzip:')

  const libReg = /^__LIB__(\w*)$/i
  const stats = output.stats.toJson({
    chunks: false,
    modules: false,
    chunkModules: false
  }).children
  const compStats = stats.filter(info => libReg.test(info.publicPath))
  const newStats = stats.map((st, i) => {
    st['__path'] = webpackConfs[i].output.path

    return st
  })

  buildReporter(newStats)
}

function error(err) {
  console.log(chalk.red('Failed to compile.\n'))
  printBuildError(err)
  process.exit(1)
}

clean(dists)
  .then(build)
  .then(success)
  .catch(error)
