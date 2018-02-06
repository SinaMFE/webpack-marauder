'use strict'

const yargs = require('yargs')
const chalk = require('chalk')
const { prompt } = require('inquirer')
const config = require('../config')
const { getPageList } = require('./utils')

// TL
// 识别 entry, branch
// 可指定输入页面名，或选择页面名

// npm run build
// npm run build --ftp
// npm run build index --ftp
// 输入出错

const pages = getPageList(config.paths.entries)
let input = yargs.argv._

// 存在多页面文件夹时，页面名必传检查（短路操作）
// if (pages.length > 1) {
//   input = yargs.command('npm run build <page> [--ftp] [namespace]').argv._
// } else {
//   // 只有一个页面文件夹时，页面名参数不做必传校验
//   input = yargs.argv._
// }

let entry = input[0]

if (!entry) {
  // 无页面名输入，将唯一的页面作为输入名
  entry = pages[0]
  chooseEntry(pages)
} else if (!pages.includes(entry)) {
  console.log(
    `😂  ${chalk.red(`页面 ${entry} 输入有误`)}  ${chalk.green(
      `可选值：【${pages}】`
    )}\n`
  )
  process.exit(1)
}

async function chooseEntry() {
  const question = {
    type: 'list',
    name: 'entry',
    choices: pages,
    default: pages.indexOf('index'),
    message: '请选择页面'
  }
  let entry = input[0]

  if (pages.length > 1) {
    const answer = await prompt(question)
    entry = answer.entry
  }

  if (!entry) {
    // 无页面名输入，将唯一的页面作为输入名
    entry = pages[0]
    chooseEntry(pages)
  } else if (!pages.includes(entry)) {
    console.log(
      `😂  ${chalk.red(`页面 ${entry} 输入有误`)}  ${chalk.green(
        `可选值：【${pages}】`
      )}\n`
    )
    process.exit(1)
  }

  return {
    entry,
    ftpBranch: input[1]
  }
}

module.exports = {
  input,
  pages,
  chooseEntry
}
