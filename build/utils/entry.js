const yargs = require('yargs')
const chalk = require('chalk')
const config = require('../config')
const { getPageList } = require('./utils')

const pages = getPageList(config.paths.entries)
let input = []

// 存在多页面文件夹时，必须指定页面名（短路操作）
if (pages.length > 1) {
  input = yargs
    .command('npm run build <page> [--ftp] [namespace]')
    .demandCommand(
      1,
      `😂  ${chalk.red('请指定页面名')}  ${chalk.green(
        `可选值:【${pages}】\n`
      )}`
    ).argv._
} else {
  // 只有一个页面文件夹时，页面名参数不做必传校验
  input = yargs.argv._
}

let entry = input[0]

if (!entry) {
  // 无页面名输入，将唯一的页面作为输入名
  entry = pages[0]
} else if (!pages.includes(entry)) {
  console.log(
    `😂  ${chalk.red(`页面 ${entry} 输入有误`)}  ${chalk.green(
      `可选值：【${pages}】`
    )}\n`
  )
  process.exit(1)
}

module.exports = {
  input,
  entry,
  ftpBranch: input[1]
}
