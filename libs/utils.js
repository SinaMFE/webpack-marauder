'use strict'

const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const devIp = require('dev-ip')
const portscanner = require('portscanner')

// 【注意】utils.js 为纯工具库，请不要依赖 config/index.js

// From create-react-app
// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd())

function rootPath(relativePath) {
  return path.resolve(appDirectory, relativePath)
}

/**
 * 获取入口文件名列表
 * @return {Array} 入口名数组
 */
function getPageList(entry) {
  const entries = getEntries(`${process.cwd()}/${entry}`)
  return Object.keys(entries)
}

/**
 * 获取本机局域网 ip
 * @return {String} ip
 */
function localIp() {
  const ip = devIp()
  // vpn 下 ip 为数组，第一个元素为本机局域网 ip
  // 第二个元素为 vpn 远程局域网 ip
  return ip ? (Array.isArray(ip) ? ip[0] : ip) : '0.0.0.0'
}

/**
 * 获取空闲端口号，范围 [start, start + 20]
 * @return {Number} 端口号
 */
async function getFreePort(defPort) {
  const ceiling = Number(defPort + 20)

  return portscanner.findAPortNotInUse(defPort, ceiling, localIp())
}

/**
 * 获取指定路径下的入口文件
 * @param  {String} globPath 通配符路径
 * @param  {String} preDep 前置模块
 * @return {Object}          入口名:路径 键值对
 * {
 *   pageA: ['a.js'],
 *   pageB: ['b.js']
 * }
 */
function getEntries(globPath, preDep = []) {
  const files = glob.sync(rootPath(globPath))
  const getPageName = filepath => {
    const dirname = path.dirname(path.relative('src/view/', filepath))
    // 兼容组件，src/index.js
    return dirname === '..' ? 'index' : dirname
  }

  // glob 按照字母顺序取 .js 与 .ts 文件
  // 通过 reverse 强制使 js 文件在 ts 之后，达到覆盖目的
  // 保证 index.js 优先原则
  return files.reverse().reduce((entries, filepath) => {
    const name = getPageName(filepath)
    // preDep 支持数组或字符串。所以这里使用 concat 方法
    entries[name] = [].concat(preDep, filepath)

    return entries
  }, {})
}

function getEntryPoints(globPath, preDep = []) {
  const files = glob.sync(rootPath(globPath))
  const getTrunkName = filepath => {
    const basename = path.posix.basename(filepath, '.js')
    return basename.replace(/^index\./, '') + '.servant'
  }

  return files.reduce((chunks, filepath) => {
    const name = getTrunkName(filepath)
    // preDep 支持数组或字符串。所以这里使用 concat 方法
    chunks[name] = [].concat(preDep, filepath)

    return chunks
  }, {})
}

/**
 * 解析日期
 * @param  {Date | Number} target 日期对象或时间戳
 * @return {Object}        结果对象
 */
function parseDate(target) {
  const f = n => (n > 9 ? n : '0' + n)
  const date = target instanceof Date ? target : new Date(target)
  return {
    y: date.getFullYear(),
    M: f(date.getMonth() + 1),
    d: f(date.getDate()),
    h: f(date.getHours()),
    m: f(date.getMinutes()),
    s: f(date.getSeconds())
  }
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param  {Date | Number} dt 日期对象或时间戳
 * @return {String}    格式化结果
 */
function pubDate(dt) {
  const date = parseDate(dt)
  return `${date.y}-${date.M}-${date.d}`
}

/**
 * 生成 banner
 * @return {String} 包含项目版本号，构建日期
 */
function banner() {
  return (
    `@version ${process.env.npm_package_version}\n` +
    `@date ${pubDate(new Date())}\n` +
    // 对 bundle 文件添加 @generated 标识
    // 在 code review 面板忽略相关 diff
    `@generated`
  )
}

function isNotEmptyArray(target) {
  return Array.isArray(target) && target.length
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function ensureSlash(path, needsSlash) {
  const hasSlash = path.endsWith('/')
  if (hasSlash && !needsSlash) {
    return path.substr(path, path.length - 1)
  } else if (!hasSlash && needsSlash) {
    return `${path}/`
  } else {
    return path
  }
}

function camelName(name) {
  return name
}

// https://stackoverflow.com/questions/20270973/nodejs-spawn-stdout-string-format
function buffer2String(data) {
  return data.toString().replace(/[\n\r]/g, '')
}

function assetsPath(_path) {
  return path.posix.join('static', _path)
}

function readJson(file) {
  return fs.readJsonSync(file, { throws: false })
}

module.exports = {
  assetsPath,
  isObject,
  getPageList,
  localIp,
  getFreePort,
  getEntries,
  getEntryPoints,
  rootPath,
  parseDate,
  pubDate,
  banner,
  isNotEmptyArray,
  ensureSlash,
  camelName,
  buffer2String,
  readJson
}
