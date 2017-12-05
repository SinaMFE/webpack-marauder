const fs = require('fs')
const path = require('path')
const paths = require('./paths')

const NODE_ENV = process.env.NODE_ENV
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  )
}

// 自定义环境变量前缀
const MARA = /^MARA_/i

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${paths.dotenv}.local`,
  paths.dotenv
].filter(Boolean)

// merge .env* 文件中的环境变量
// dotenv 永远不会覆盖已经存在的环境变量
// 对于环境中已存在的同名变量，dotenv 会略过设置
// https://github.com/motdotla/dotenv
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv').config({
      // 使用自定义路径
      path: dotenvFile
    })
  }
})

function getEnv(publicUrl) {
  const baseEnv = {
    // 标识开发与生产环境
    // React 内部依赖此变量
    NODE_ENV: process.env.NODE_ENV || 'development',
    // 方便使用公共资源路径
    // 在 js 内，以 process.env.PUBLIC_URL 变量存在
    // html 中可使用 %PUBLIC_URL% 占位符
    // 例：<img src="%PUBLIC_URL%/img/logo.png">
    PUBLIC_URL: publicUrl
  }
  const raw = Object.keys(process.env)
    // 混合自定义环境变量
    // 为防止环境变量混淆，自定义变量需以 MARA_ 作为前缀
    .filter(key => MARA.test(key))
    .reduce((env, key) => {
      env[key] = process.env[key]
      return env
    }, baseEnv)

  // DefinePlugin 需要传入序列化参数值
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key])
      return env
    }, {})
  }

  return { raw, stringified }
}

module.exports = getEnv
