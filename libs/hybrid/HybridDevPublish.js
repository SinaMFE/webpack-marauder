'use strict'

const fs = require('fs')
const md5 = require('md5')
const Vinyl = require('vinyl')
const chalk = require('chalk')
const config = require('../../config')
const { getFile, uploadVinylFile } = require('../ftp')
const { rootPath, execAsync, buffer2String } = require('../utils')
const CONF_DIR = '/wap_front/hybrid/config/'
const CONF_NAME = 'sina_news.json'
const CONF_PATH = `${CONF_DIR}/${CONF_NAME}`

const publishStep = [
  `${chalk.blue('🐝  [1/4]')} Fetching config...`,
  // ✏️ 后面需要多补充一个空格
  `${chalk.blue('✏️   [2/4]')} Updating config...`,
  `${chalk.blue('🚀  [3/4]')} Pushing config...`,
  `${chalk.blue('🎉  [4/4]')} ${chalk.green('Success')}\n`
]

async function hybridDevPublish(entry, remotePath) {
  console.log('----------- Hybrid Publish Dev -----------\n')
  console.log(publishStep[0])

  const hbConf = await getHbConf(CONF_PATH)
  const repoName = await getGitRepoName()
  const moduleName = `${repoName}/${entry}`
  const localPkgPath = rootPath(`dist/${entry}/${entry}.php`)
  const moduleIdx = hbConf.data.modules.findIndex(
    item => item.name === moduleName
  )
  const hbMod = {
    name: moduleName,
    version: process.env.npm_package_version,
    pkg_url: `${remotePath + entry}.php`,
    hybrid: true,
    md5: md5(fs.readFileSync(localPkgPath))
  }

  console.log(publishStep[1])
  if (moduleIdx > -1) {
    hbConf.data.modules[moduleIdx] = hbMod
  } else {
    hbConf.data.modules.push(hbMod)
  }

  console.log(publishStep[2])
  await updateRemoteHbConf(hbConf)
  console.log(publishStep[3])

  logResult(hbMod)
}

async function updateRemoteHbConf(hbConf) {
  // 创建虚拟文件
  const confFile = new Vinyl({
    path: rootPath(CONF_NAME),
    contents: Buffer.from(JSON.stringify(hbConf))
  })

  try {
    await uploadVinylFile(confFile, CONF_DIR)
  } catch (e) {
    console.log('Hybrid config 上传失败')
    throw new Error(e)
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
    const hbConf = JSON.parse(buffer2String(buffer))
    const initConf = {
      status: 0,
      reqTime: Date.now(),
      data: {
        modules: []
      }
    }

    return hbConf || initConf
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
    `\n${chalk.bgYellow(' CONF ')} ${chalk.yellow(
      'http://wap_front.dev.sina.cn/hybrid/config/sina_news.json'
    )}\n`
  )
}

module.exports = hybridDevPublish
