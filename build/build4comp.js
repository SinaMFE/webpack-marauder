// 确保在文件首部设置环境变量
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

const config = require('./config')
const paths = config.paths
const maraConf = require(paths.marauder)
const { getPageList } = require('./utils/utils')
const pages = getPageList(config.paths.entries)
const spawnSync = require('spawn-sync')

console.log('Biuld component...\n')

pages.unshift(config.keyword.UMDCOMPILE)
pages.forEach(entry => {
  try {
    var result = spawnSync('node', [
      './node_modules/webpack-marauder/build/build.js',
      entry
    ])

    if (result.status !== 0) {
      process.stderr.write(result.stderr)
      process.exit(result.status)
    } else {
      process.stdout.write(result.stdout)
      process.stderr.write(result.stderr)
    }
  } catch (e) {
    console.log('批量执行出错！')
  }
})
