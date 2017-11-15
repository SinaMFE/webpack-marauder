const { getPageList } = require('./utils')
const chalk = require('chalk')
const config = require('../config')
const yargs = require('yargs')

const pages = getPageList(config.paths.entries)
let input = []

// 存在多页面文件夹时，必须指定页面名（短路操作）
if (pages.length > 1) {
  input = yargs
    .command('npm run build <page> [--ftp] [namespace]')
    .demandCommand(
      1,
      `😂  ${chalk.bgRed('请指定页面名')}  ${chalk.green(`可选值:【${pages}】\n`)}`
    ).argv._
} else {
  // 只有一个页面文件夹时，页面名参数不做必传校验
  input = yargs.argv._
}

if (!input[0]) {
  // 无页面名输入，将唯一的页面作为输入名
  input[0] = pages[0]
} else if (!pages.includes(input[0])) {
  // 页面名有输入时，校验输入页面名的合法性
  console.log(
    `😂  ${chalk.bgRed(`页面 ${input[0]} 输入有误`)}  ${chalk.green(
      `可选值：【${pages}】`
    )}\n`
  )
  process.exit(1)
}

// 写入运行时环境
process.env.ENTRY = input[0]
process.env.PAGES = pages

module.exports = {
  input,
  entry: input[0],
  ftpBranch: input[1]
}
