const path = require("path");
const cwd = process.cwd();
const uploadftp = require("uploadftp/uploadftp");
const Ftp = require("uploadftp/ftp");
const fs = require("fs");
const md5 = require("md5");

let ftpOption = {
  host: "172.16.142.74",
  user: "www",
  password: "0ecd15a9fee9dea3",
  port: "2121",
  src: "",
  dest: ""
};

class Hybrid {
  constructor({ entry, ftpBranch }) {
    this.ftp = new Ftp();
    this.getOption({ entry, ftpBranch });
  }

  async changeHybridConfig() {
    let config = {};
    await this.ftp.connect(ftpOption);
    let configPath = `/wap_front/hybrid/config/${this.zip_config_name}.json`;
    try {
      config = await this.ftp.get(configPath);
      config = JSON.parse(config);
    } catch (e) {
      console.log(`测试服务器上没有${configPath},将新创建该文件`);
    }
    let moduleName = `${this.name}/${this.viewname}`;
    let local_pkg_path = path.resolve(
      cwd,
      `dist/${this.viewname}/${this.viewname}.php`
    );
    let pkgmd5 = md5(fs.readFileSync(local_pkg_path));
    let pkg_url = `http://wap_front.dev.sina.cn/marauder/${this.name}/${
      this.isPathVersion ? this.version + "/" : ""
    }${this.branch ? "branch_" + this.branch + "/" : ""}${this.viewname}/${
      this.viewname
    }.php`;
    let isHave;

    if (!config) {
      config = {
        status: 0,
        reqTime: 1514865810972,
        data: {
          modules: []
        }
      };
    }

    config.data.modules.forEach(item => {
      if (item.name == moduleName) {
        item.version = this.version;
        item.pkg_url = pkg_url;
        item.hybrid = this.maraConf.hybrid;
        item.md5 = pkgmd5;

        isHave = true;
      }
    });

    if (!isHave) {
      config.data.modules.push({
        name: moduleName,
        version: this.version,
        pkg_url: pkg_url,
        hybrid: this.maraConf.hybrid
      });
    }

    let localConfigPath = path.resolve(
      cwd,
      `dist/${this.viewname}/${this.zip_config_name}.json`
    );
    fs.writeFileSync(localConfigPath, JSON.stringify(config));
    ftpOption.src = localConfigPath;
    ftpOption.dest = "/wap_front/hybrid/config/";
    await uploadftp(ftpOption);

    let configUrl = `http://wap_front.dev.sina.cn/hybrid/config/${
      this.zip_config_name
    }.json`;
    console.log("hybrid config: " + configUrl);
    this.ftp.end();
  }

  getOption({ entry, ftpBranch }) {
    this.viewname = entry;
    this.branch = ftpBranch;
    let maraConf = require(path.resolve(cwd, "marauder.config.js"));
    this.maraConf = maraConf;
    if (
      maraConf.ftp &&
      maraConf.ftp &&
      maraConf.ftp.remotePath &&
      maraConf.ftp.remotePath.version
    ) {
      this.isPathVersion = true;
    }
    let ciConfig = maraConf.ciConfig;
    if (ciConfig) {
      this.zip_config_name = ciConfig.zip_config_name;
    } else {
      this.zip_config_name = "default";
    }
    let packageJson = JSON.parse(
      fs.readFileSync(path.resolve(cwd, "./package.json"))
    );
    let { name, version } = packageJson;
    this.name = name;
    this.version = version;
  }
}

module.exports = Hybrid;
