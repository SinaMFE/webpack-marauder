#!/usr/bin/env node

let Ftp = require("./ftp");
let fs = require("fs");
let path = require("path");
let uploadRecur = require("./uploadRecur");

let cwd = process.cwd();

let ftp = new Ftp();

module.exports = async option => {
  if (!option) {
    option = require(path.resolve(cwd, "./uploadftpOption"));
  }

  if (!option.src || !option.dest) {
    console.error("you have not src/dest option in your uploadOption.js !");
    return;
  }
  let src = path.resolve(cwd, option.src);
  let dest = option.dest;
  if (!fs.existsSync(src)) {
    console.error(`you have not ${src} in your computer !`);
    return;
  }

  await ftp.connect(option);
  console.log("uploadftp connect !");

  await uploadRecur(src, dest, ftp);

  await ftp.end();
  console.log("uploadftp end !");
};
