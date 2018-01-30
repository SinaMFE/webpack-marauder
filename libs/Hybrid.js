const path = require('path')
const cwd = process.cwd()
const uploadftp = require('uploadftp/uploadftp')
const Ftp = require('uploadftp/ftp')
const fs = require('fs')
const md5 = require('md5')
const execAsync = require('../libs/execAsync')
const config = require('../config')

let ftpOption = config.ftp

function logResult({ configUrl, module }) {
  console.log('\nHybrid config: ' + configUrl)
  for (let key in module) {
    console.log(`${key}:`, module[key])
  }
}

class Hybrid {
  constructor({ entry, ftpBranch, remotePath }) {
    this.ftp = new Ftp()
    this.entry = entry
    this.ftpBranch = ftpBranch
    this.remotePath = remotePath
  }

  async changeHybridConfig() {
    await this.getOption({ entry: this.entry, ftpBranch: this.ftpBranch })
    if (!this.name) {
      console.log('获取git工程名失败，请检查是否设置远程git仓库')
      return
    }
    let config = {}
    await this.ftp.connect(ftpOption)
    let configPath = `/wap_front/hybrid/config/${this.zip_config_name}.json`
    try {
      config = await this.ftp.get(configPath)
      config = JSON.parse(config)
    } catch (e) {
      console.log(`测试服务器上没有${configPath},将新创建该文件`)
    }
    let moduleName = `${this.name}/${this.viewname}`
    let local_pkg_path = path.resolve(
      cwd,
      `dist/${this.viewname}/${this.viewname}.php`
    )
    let pkgmd5 = md5(fs.readFileSync(local_pkg_path))
    // let pkg_url = `http://wap_front.dev.sina.cn/marauder/${this.name}/${
    //   this.isPathVersion ? this.version + "/" : ""
    // }${this.branch ? "branch_" + this.branch + "/" : ""}${this.viewname}/${
    //   this.viewname
    // }.php`;
    let pkg_url = this.remotePath + this.viewname + '.php'

    if (!config) {
      config = {
        status: 0,
        reqTime: 1514865810972,
        data: {
          modules: []
        }
      }
    }

    const moduleIdx = config.data.modules.findIndex(
      item => item.name == moduleName
    )

    const module = {
      name: moduleName,
      version: this.version,
      pkg_url: pkg_url,
      hybrid: this.maraConf.hybrid,
      md5: pkgmd5
    }

    if (moduleIdx > -1) {
      config.data.modules[moduleIdx] = module
    } else {
      config.data.modules.push(module)
    }

    let localConfigPath = path.resolve(
      cwd,
      `dist/${this.viewname}/${this.zip_config_name}.json`
    )

    try {
      fs.writeFileSync(localConfigPath, JSON.stringify(config))
      ftpOption.src = localConfigPath
      ftpOption.dest = '/wap_front/hybrid/config/'
      await uploadftp(ftpOption)

      let configUrl = `http://wap_front.dev.sina.cn/hybrid/config/${
        this.zip_config_name
      }.json`

      logResult({ configUrl, module })
    } catch (e) {
      console.error('Hybrid config 上传失败', e)
    }
    this.ftp.end()
  }

  async getOption({ entry, ftpBranch }) {
    this.viewname = entry
    this.branch = ftpBranch
    let maraConf = require(path.resolve(cwd, 'marauder.config.js'))
    this.maraConf = maraConf
    if (
      maraConf.ftp &&
      maraConf.ftp &&
      maraConf.ftp.remotePath &&
      maraConf.ftp.remotePath.version
    ) {
      this.isPathVersion = true
    }
    let ciConfig = maraConf.ciConfig
    if (ciConfig) {
      this.zip_config_name = ciConfig.zip_config_name
    } else {
      this.zip_config_name = 'default'
    }
    let packageJson = JSON.parse(
      fs.readFileSync(path.resolve(cwd, './package.json'))
    )

    try {
      let { stdout, stderr } = await execAsync('git remote -v')
      if (stdout && !stderr) {
        let [fullname, name] = stdout.match(/([\w-]*)\.git/)
        this.name = name
      }
    } catch (e) {
      console.error(e)
    }

    let { version } = packageJson
    this.version = version
  }
}

module.exports = Hybrid
