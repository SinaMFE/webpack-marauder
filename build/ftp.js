const fs = require('vinyl-fs')
const Ftp = require('vinyl-ftp')
const opn = require('opn')
const path = require('path')
const chalk = require('chalk')
const { rootPath } = require('./utils.js')
const marauderConfig = require(rootPath('marauder.config.js'))
const config = require('./config.js')
const argv = require('yargs').argv._

const ftpConf = Object.assign({}, config.ftp, marauderConfig.ftp)

async function upload(filePath, remotePath) {
  console.log(
    `${chalk.blue('🌝  [1/2]')} Connecting ${chalk.yellow(config.ftp.host)}...`
  )
  const conn = new Ftp(ftpConf)

  return new Promise((resolve, reject) => {
    console.log(`${chalk.blue('🚀  [2/2]')} Uploading package...`)
    fs.src([filePath], { buffer: false }).pipe(
      conn
        .dest(remotePath)
        .on('end', () => {
          resolve()
        })
        .on('error', err => {
          reject(err)
        })
    )
  })
}

module.exports = async function(page, namespace) {
  const host = 'http://wap_front.dev.sina.cn'
  const projName = process.env.npm_package_name
  const projVer = process.env.npm_package_version

  page = `${page}/` || ''
  namespace = namespace ? `branch_${namespace}` : ''

  // /wap_front/marauder/hdphoto/1.1.0/wensen/index
  const remotePath = path.posix.join(
    '/wap_front/marauder',
    projName,
    ftpConf.remotePath.version ? projVer : '',
    namespace,
    page
  )
  const localPath = rootPath(`dist/${page}`) + '/**'

  try {
    await upload(localPath, remotePath)
    console.log(chalk.green('🎉  success!'))

    const url = host + remotePath.replace('/wap_front', '')
    console.log(chalk.bgYellow('\nRemote url'), chalk.yellow(`${url}`))
    opn(url, { wait: false })
  } catch (err) {
    console.log(`\n🌚  ${chalk.red(err)}`)
    process.exit(1)
  }
}
