const config = require('./config')
const paths = config.paths
const maraConf = require(paths.marauder)
const { getPageList } = require('./utils/utils')
const pages = getPageList(config.paths.entries)
var spawnSync = require('spawn-sync')

pages.splice(0, 0, config.keyword.UMDCOMPILE)

for (var i = 0; i < pages.length; i++) {
  try {
    var result = spawnSync('node', [
      './node_modules/webpack-marauder/build/build.js',
      pages[i]
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
}
