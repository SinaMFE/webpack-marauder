'use strict'

// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

process.on('unhandledRejection', err => {
  throw err
})

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const ora = require('ora')
const glob = require('glob')
const webpack = require('webpack')
const { getPageList } = require('../libs/utils')
const config = require('../config')
const paths = config.paths
const maraConf = require(paths.marauder)
const getWebpackProdConf = require('../webpack/webpack.prod.conf')
const getWebpackLibConf = require('../webpack/webpack.lib.conf')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const printBuildError = require('../libs/printBuildError')
const buildReporter = require('../libs/buildReporter')
const prehandleConfig = require('../libs/prehandleConfig')
const Stopwatch = require('../libs/Stopwatch')

const spinner = ora('Biuld library (commonjs + umd)...')
spinner.start()

const pages = getPageList(config.paths.entries)
const libs = [
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

const webpackConfs = libs.concat(pages).map(target => {
  return typeof target === 'object'
    ? getWebpackLibConf(target)
    : getWebpackProdConf({ entry: target })
})

function build(dists) {
  // @TODO 多配置应用 prehandleConfig
  // const webpackConfig = prehandleConfig('lib', webpackConfig);
  const ticker = new Stopwatch()
  const compiler = webpack(webpackConfs)

  return new Promise((resolve, reject) => {
    ticker.start()
    compiler.run((err, stats) => {
      const time = ticker.check()
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
        time,
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
  console.log(chalk.green(`Build complete in ${output.time}ms\n`))
  console.log('File sizes after gzip:\n')

  const { children } = output.stats.toJson({
    hash: false,
    chunks: false,
    modules: false,
    chunkModules: false
  })
  const compAssets = {
    lib: children.slice(0, libs.length),
    demo: children.slice(libs.length)
  }

  compAssets.lib = compAssets.lib.map((stats, i) => {
    return stats.assets.map(a => {
      a['__dist'] = paths.lib
      a['__format'] = libs[i].format
      return a
    })
  })

  compAssets.demo = compAssets.demo.map((stats, i) => {
    stats.assets['__dist'] = path.join(paths.dist, pages[i])
    return stats.assets
  })

  buildReporter(compAssets)
}

// 旧版脚手架 umd 文件输出为 dist/main.min.js
// 通过 --old 配置开启兼容模式
async function backwards() {
  if (!process.argv.slice(2).includes('--old')) return

  const umdLibs = glob.sync(path.join(paths.lib, 'index?(.min).js'))

  return Promise.all(
    umdLibs.map(file => {
      const name = path.basename(file).replace('index', 'main')
      return fs.copy(file, path.join(paths.dist, name))
    })
  ).then(() => {
    console.log(
      chalk.green(
        '\nSynchronized umd libs to dist for backwards compatibility.'
      )
    )
  })
}

function error(err) {
  console.log(chalk.red('Failed to compile.\n'))
  printBuildError(err)
  process.exit(1)
}

clean({
  distDir: paths.dist,
  libDir: paths.lib
})
  .then(build)
  .then(success)
  .then(backwards)
  .catch(error)
