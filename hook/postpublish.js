'use strict'

const path = require('path')
const fs = require('fs')
const cwd = process.cwd()

const packageConfig = require(path.resolve(cwd, 'package.json'))
const distPath = path.resolve(cwd, 'dist')

const glob = require('glob')
const files = glob.sync(distPath + '/**')

const http = require('http')
const chalk = require('chalk')
const ora = require('ora')

const spinner = ora('开始上线umd资源到mjs...')

// marauder.config.js
//   //用于描述 组件 工程化相关属性
// pkgConfig:{
//   noticeAfterPublish:true,//false
//   noticeLevel:"",//patch minor major  分别对应 发小版本，中版本，大版本 以及以上才发，比如 prepatch ，preminor 都不进行触发。
// }
let noticeAfterPublish = false
let noticeLevel = 'minor'

if (fs.existsSync(path.resolve(cwd, 'marauder.config.js'))) {
  const maraConf = require(path.resolve(cwd, 'marauder.config.js'))

  if (
    maraConf &&
    maraConf.pkgConfig &&
    maraConf.pkgConfig.noticeAfterPublish == true
  ) {
    noticeAfterPublish = maraConf.pkgConfig.noticeAfterPublish
    noticeLevel = maraConf.pkgConfig.noticeLevel || 'minor'
  }
}

console.log('开始上线umd资源到mjs...')

spinner.start()
let url =
  'http://exp.smfe.sina.cn/componentUmd?name=' +
  packageConfig.name +
  '&version=' +
  packageConfig.version
if (noticeAfterPublish) {
  url += '&noticeAfterPublish=1&noticeLevel=' + noticeLevel
}
http
  .get(url, function(res) {
    spinner.stop()
    console.log(chalk.cyan('静态资源上线cnpm-mjs通知成功\n,线上相对路径为：'))
    for (var i = 0; i < files.length; i++) {
      if (
        path.relative(distPath, files[i]) == null ||
        path.relative(distPath, files[i]) == ''
      ) {
        continue
      }
      console.log(
        chalk.cyan(
          'http://mjs.sinaimg.cn/umd/' +
            packageConfig.name.replace('@mfelibs/', '') +
            '/' +
            packageConfig.version +
            '/' +
            path.relative(distPath, files[i])
        )
      )
    }
  })
  .on('error', function(e) {
    spinner.stop()
    console.log(e)
    console.log(
      chalk.red('静态资源上线cnpm-mjs通知失败\n请手动重试如下链接：' + url)
    )
  })
