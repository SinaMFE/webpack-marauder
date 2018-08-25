'use strict'

const vfs = require('vinyl-fs')
const Ftp = require('vinyl-ftp')
const openBrowser = require('react-dev-utils/openBrowser')
const path = require('path')
const chalk = require('chalk')
const config = require('../config')
const { rootPath } = require('./utils')

const isInteractive = process.stdout.isTTY
const ftpConf = config.ftp
const uploadStep = [
  `${chalk.blue('🌝  [1/2]')} Connecting ${chalk.yellow(config.ftp.host)}...`,
  `${chalk.blue('🚀  [2/2]')} Uploading package...`
]

async function upload(filePath, remotePath) {
  console.log('----------- Ftp uploading ---------------\n')
  console.log(uploadStep[0])
  const conn = new Ftp(ftpConf)

  return new Promise((resolve, reject) => {
    console.log(uploadStep[1])

    vfs.src([filePath], { buffer: false }).pipe(
      conn
        .dest(remotePath)
        .on('end', resolve)
        .on('error', reject)
    )
  })
}

function getRemotePath(page, namespace) {
  const projName = process.env.npm_package_name
  const projVer = process.env.npm_package_version

  namespace = namespace ? `branch_${namespace}` : ''

  return path.posix.join(
    '/wap_front/marauder',
    projName,
    ftpConf.remotePath.version ? projVer : '',
    namespace,
    page
  )
}

module.exports.uploadVinylFile = async function(vinylFile, remoteFolder) {
  const conn = new Ftp(ftpConf)
  const remotePath = path
    .join('/', remoteFolder, vinylFile.relative)
    .replace(/\\/g, '/')

  return new Promise((resolve, reject) => {
    // vinyl-ftp 私有方法，接受一个 Vinyl 文件
    conn.upload(vinylFile, remotePath, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}

module.exports.uploadDir = async function(page, namespace) {
  const HOST = 'http://wap_front.dev.sina.cn'

  page = `${page}/` || ''

  // /wap_front/marauder/hdphoto/1.1.0/wensen/index
  const remotePath = getRemotePath(page, namespace)
  const localPath = rootPath(`dist/${page}`) + '/**'

  try {
    await upload(localPath, remotePath)
    console.log(chalk.green('🎉  success!'))

    const url = HOST + remotePath.replace('/wap_front', '')
    console.log('\n', chalk.bgYellow(' URL '), chalk.yellow(`${url}`), '\n')

    ftpConf.openBrowser && isInteractive && openBrowser(url)

    return url
  } catch (err) {
    console.log(`\n🌚  ${chalk.red(err)}`)
    console.log(
      chalk.red('   上传失败，请确保已在 marauder.config 中正确配置 ftp 信息')
    )
  }
}

module.exports.getFile = async function(remotePath) {
  const conn = new Ftp(ftpConf)

  return new Promise((resolve, reject) => {
    conn
      .src(remotePath, { buffer: true })
      .on('data', file => resolve(file.contents))
      .on('error', reject)
  })
}
