var path = require('path')
var cwd = process.cwd()

var packageConfig = require(path.resolve(cwd, 'package.json'))
var distPath = path.resolve(cwd, 'dist')

var glob = require('glob')
var files = glob.sync(distPath + '/**')

var http = require('http')
var chalk = require('chalk')
var ora = require('ora')

var spinner = ora('开始上线umd资源到mjs...')
console.log('开始上线umd资源到mjs...')
spinner.start()
http
  .get(
    'http://exp.smfe.sina.cn/componentUmd?name=' +
      packageConfig.name +
      '&version=' +
      packageConfig.version,
    function(res) {
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
    }
  )
  .on('error', function(e) {
    spinner.stop()
    console.log(e)
    console.log(
      chalk.red(
        '静态资源上线cnpm-mjs通知失败\n请手动重试如下链接：' +
          'http://exp.smfe.sina.cn/componentUmd?name=' +
          packageConfig.name +
          '&version=' +
          packageConfig.version
      )
    )
  })
