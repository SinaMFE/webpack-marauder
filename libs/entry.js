'use strict'

const chalk = require('chalk')
const { prompt, Separator } = require('inquirer')
const config = require('../config')
const { getPageList } = require('./utils')

const args = process.argv.slice(2)
const pages = getPageList(config.paths.entries)

// console.log(args)

// TL
// 识别 entry, branch
// 可指定输入页面名，或选择页面名

// npm run build
// npm run build --ftp
// npm run build index --ftp
// 输入出错

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
  return Promise.resolve({ entry, trunk: args[1] })
}

function chooseOne() {
  const illegalInput = args.length && !validEntry(args[0])

  if (illegalInput) {
    return chooseEntry('您输入的页面有误, 请选择:')
  } else {
    return result(pages[0])
  }
}

function chooseMany() {
  if (validEntry(args[0])) return result(args[0])

  return chooseEntry(args.length && '您输入的页面有误, 请选择:')
}

function validEntry(entry) {
  return pages.includes(entry)
}

async function chooseEntry(msg) {
  const list = [...pages, new Separator(), { name: 'exit', value: '' }]
  const question = {
    type: 'list',
    name: 'entry',
    choices: list,
    default: list.indexOf('index'),
    // message 不可为空串
    message: msg || '请选择:'
  }
  const { entry } = await prompt(question)

  if (!entry) process.exit(0)

  return result(entry)
}

module.exports = getEntry
