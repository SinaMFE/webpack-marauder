'use strict'

const fs = require('fs')
const md5 = require('md5')
const Vinyl = require('vinyl')
const chalk = require('chalk')
const { getFile, uploadVinylFile } = require('../ftp')
const { rootPath, execAsync, buffer2String } = require('../utils')
const CONF_DIR = '/wap_front/hybrid/config/'
const CONF_NAME = 'sina_news.json'
const CONF_PATH = `${CONF_DIR}/${CONF_NAME}`

async function hybridDevPublish(entry, remotePath) {
  console.log('----------- hbConf updating ---------------\n')

  const repoName = await getGitRepoName()
  const config = await getHbConf(CONF_PATH)
  const moduleName = `${repoName}/${entry}`
  const localPkgPath = rootPath(`dist/${entry}/${entry}.php`)
  const moduleIdx = config.data.modules.findIndex(
    item => item.name === moduleName
  )
  const hbMod = {
    name: moduleName,
    version: process.env.npm_package_version,
    pkg_url: `${remotePath + entry}.php`,
    hybrid: true,
    md5: md5(fs.readFileSync(localPkgPath))
  }

  if (moduleIdx > -1) {
    config.data.modules[moduleIdx] = hbMod
  } else {
    config.data.modules.push(hbMod)
  }

  updateRemoteHbConf(config, hbMod)
}

async function updateRemoteHbConf(config, hbMod) {
  // 创建虚拟文件
  const confFile = new Vinyl({
    path: rootPath(CONF_NAME),
    contents: Buffer.from(JSON.stringify(config))
  })

  try {
    await uploadVinylFile(confFile, CONF_DIR)

    logResult(hbMod)
  } catch (e) {
    console.error('Hybrid config 上传失败', e)
  }
}

async function getGitRepoName() {
  try {
    const { stdout, stderr } = await execAsync('git remote -v')

    if (stdout && !stderr) {
      // @FIXME 对 http 协议地址不可用
      const [fullname, name] = stdout.match(/([\w-]*)\.git/)

      return name.toLowerCase()
    } else {
      error(stderr)
    }
  } catch (e) {
    error(e)
  }

  function error(e) {
    console.log('获取git工程名失败，请检查是否设置远程git仓库')
    throw new Error(e)
  }
}

async function getHbConf(confPath) {
  try {
    const buffer = await getFile(CONF_PATH)
    const config = JSON.parse(buffer2String(buffer))

    return (
      config || {
        status: 0,
        reqTime: Date.now(),
        data: {
          modules: []
        }
      }
    )
  } catch (e) {
    console.log(
      `测试服务器上没有${CONF_PATH},或者当前网络问题以及config被人工修改不能被识别，请联系管理员或者重新尝试！`
    )
    throw new Error(e)
  }
}

function logResult(hbMod) {
  console.table(hbMod)
  console.log(
    '\n',
    chalk.bgYellow(' HbConf '),
    chalk.yellow('http://wap_front.dev.sina.cn/hybrid/config/sina_news.json')
  )
}

module.exports = hybridDevPublish
