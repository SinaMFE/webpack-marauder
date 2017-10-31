// https://github.com/shelljs/shelljs
process.env.NODE_ENV = 'production'

const chalk = require('chalk')
const { rootPath, getPageList } = require('./utils.js')
const pageList = getPageList()
const argv = require('yargs')
  .command('npm run build <page> [--ftp] [namespace]', '构建页面')
  .demandCommand(
    1,
    `😂  ${chalk.bgRed('请指定页面名')}  ${chalk.green(`可选值:【${pageList}】\n`)}`
  ).argv._

if (!pageList.includes(argv[0])) {
  console.log(
    `😂  ${chalk.bgRed(`页面 ${argv[0]} 输入有误`)}  ${chalk.green(
      `可选值：【${pageList}】`
    )}\n`
  )
  process.exit(1)
}

// 注意：此操作会破坏参数历史
process.argus = process.argv.splice(2)

const ora = require('ora')
const path = require('path')
const shell = require('shelljs')
const webpack = require('webpack')
const ftpUpload = require('./ftp.js')
const config = require('./config.js')
const webpackConfig = require('./webpack.prod.conf')
const maraConf = require(rootPath('marauder.config.js'))

const spinner = ora('building for production...')
spinner.start()

const assetsPath = path.join(
  config.build.assetsRoot,
  config.build.assetsSubDirectory
)

shell.rm('-rf', assetsPath)
shell.mkdir('-p', assetsPath)
shell.config.silent = true
shell.cp('-R', 'static/*', assetsPath)
shell.config.silent = false

const buildPromise = new Promise((resolve, reject) => {
  const compiler = webpack(webpackConfig, function(err, stats) {
    spinner.stop()

    if (err) {
      reject(err)
      throw err
    }

    process.stdout.write(
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
      }) + '\n\n'
    )

    if (maraConf.minpic !== false) {
      var minpic = require('./minpic.js')
    }

    console.log(chalk.cyan('  Build complete.\n'))

    console.log(
      chalk.yellow(
        '  Tip: built files are meant to be served over an HTTP server.\n' +
          "  Opening index.html over file:// won't work.\n"
      )
    )

    resolve()
  })

  compiler.plugin('compilation', compilation => {
    if (!maraConf.hybrid) return

    const hyConf = Object.assign({}, config, maraConf.hybrid)
    const hyVersionFile = ''

    compilation.assets[VERSION] = {
      source() {
        return hyVersionFile
      },
      size() {
        return hyVersionFile.length
      }
    }
  })
})

if (config.build.uploadFtp) {
  buildPromise
    .then(() => {
      ftpUpload(argv[0], argv[1])
    })
    .catch(error => {
      console.log(chalk.red(error))
    })
}
