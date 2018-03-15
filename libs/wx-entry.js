'use strict'

var path = require('path')
var fs = require('fs')
var utils = require('./utils');

function resolve(dir) {
  return path.join(utils.rootPath('src'), 'wx',dir)
}

const appEntry = {
  app: resolve('main.js')
}
const pagesEntry = getPageList(resolve('pages'), 'main.js')

function getPageList(dir, entryFile) {
  const files = fs.readdirSync(dir)
  return files.reduce((res, k) => {
    const page = path.resolve(dir, k, entryFile)
    if (fs.existsSync(page)) {
      res[k] = page
    }
    return res
  }, {})
}

async function getEntry() {
  return Object.assign({}, appEntry, pagesEntry)
}

module.exports = getEntry;
