'use strict'

const chalk = require('chalk')
const { prompt, Separator } = require('inquirer')
const config = require('../config')
const { getPageList } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const pages = getPageList(config.paths.entries)
const cmdInput = args._
let ftpBranch = args.ftp === true ? '' : args.ftp

// TL
// 识别 entry, branch
// 兼容 yarn 与 npm
// 可指定输入页面名，或选择页面名

// npm run build
// npm run build --ftp
// npm run build --ftp test
// yarn build
// yarn build index --ftp
// yarn build index --ftp test
// 输入出错

if (args.ftp) {
  config.build.uploadFtp = true
} else if (config.build.uploadFtp) {
  // 默认的 config.build.uploadFtp 为 process.env.npm_config_ftp
  // 兼容 npm
  ftpBranch = cmdInput[1]
}

function empty() {
  console.log(`😂  ${chalk.red('请创建入口文件')}\n`)
  console.log(
    `src
└── view
    ├── page1
    │   ├── ${chalk.green('index.html')}
    │   └── ${chalk.green('index.js')}
    └── page2
        ├── ${chalk.green('index.html')}
        └── ${chalk.green('index.js')}`,
    '\n'
  )
  process.exit(1)
}

async function getEntry() {
  if (!pages.length) {
    empty()
  } else if (pages.length === 1) {
    return chooseOne()
  } else {
    return chooseMany()
  }
}

function result(entry = '') {
  return Promise.resolve({ entry, ftpBranch })
}

function chooseOne() {
  const illegalInput = cmdInput.length && !validEntry(cmdInput[0])

  if (illegalInput) {
    return chooseEntry('您输入的页面有误, 请选择:')
  } else {
    return result(pages[0])
  }
}

function chooseMany() {
  if (validEntry(cmdInput[0])) return result(cmdInput[0])

  return chooseEntry(cmdInput.length && '您输入的页面有误, 请选择:')
}

function validEntry(entry) {
  return pages.includes(entry)
}

async function chooseEntry(msg) {
  const list = [...pages]
  // const list = [...pages, new Separator(), { name: 'exit', value: '' }]
  const question = {
    type: 'list',
    name: 'entry',
    choices: list,
    default: list.indexOf('index'),
    // message 不可为空串
    message: msg || '请选择您的目标页面:'
  }
  const { entry } = await prompt(question)

  if (!entry) process.exit(0)
  console.log()

  return result(entry)
}

module.exports = getEntry
