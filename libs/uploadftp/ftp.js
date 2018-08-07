let FtpClient = require("ftp");

class Ftp {
  constructor() {
    this.ftp = new FtpClient();
  }
  connect(option) {
    return new Promise(resolve => {
      this.ftp.on("ready", resolve);
      this.ftp.connect(option);
    });
  }
  end() {
    this.ftp.end();
  }
  put(src, dest) {
    return new Promise(resolve => {
      this.ftp.put(src, dest, err => {
        if (err) {
          throw err;
        }
        resolve();
      });
    });
  }
  get(dest) {
    return new Promise((resolve, reject) => {
      this.ftp.get(dest, (err, rs) => {
        if (err) {
          reject(err);
          return;
        }
        let data = "";
        rs.on("data", chunk => {
          data += chunk;
        });
        rs.on("end", () => {
          resolve(data);
        });
      });
    });
  }
  mkdir(dest) {
    return new Promise(resolve => {
      this.ftp.mkdir(dest, true, err => {
        if (err) {
          throw err;
        }
        resolve();
      });
    });
  }
}

module.exports = Ftp;
