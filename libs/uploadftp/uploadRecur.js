let fs = require("fs");
let path = require("path");

const uploadRecur = async (src, dest, ftp) => {
  if (!/\/$/.test(dest)) {
    dest = dest + "/";
  }
  console.log("from: ", src);
  console.log("to: ", dest);

  let name = path.basename(src);
  if (fs.statSync(src).isDirectory()) {
    await ftp.mkdir(dest + name);
    let files = fs.readdirSync(src);
    for (let i = 0; i < files.length; ++i) {
      let file = files[i];
      await uploadRecur(path.resolve(src, file), dest + name, ftp);
    }
  } else {
    await ftp.put(src, dest + name);
  }
};

module.exports = uploadRecur;
