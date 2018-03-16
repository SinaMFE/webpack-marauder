'use strict'

var path = require('path')
var fs = require('fs')
const fsE = require('fs-extra');
var utils = require('./utils');

function resolve(dir) {
  return path.join(utils.rootPath('src'), 'wx',dir)
}

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
  const wxDir = path.join(utils.rootPath('src'), 'wx');
  // 判断微信目录是否存在
  if(!fs.existsSync(wxDir)){
    await fsE.copy(path.resolve(__dirname, '../wx-template'), wxDir);
  }
  const appEntry = {
    app: resolve('main.js')
  }
  const pagesEntry = getPageList(resolve('pages'), 'main.js')
  return Object.assign({}, appEntry, pagesEntry)
}

module.exports = getEntry;
