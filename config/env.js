'use strict'

const fs = require('fs')
const paths = require('./paths')
const defConf = require('./default')
const maraConf = require(paths.marauder)

const NODE_ENV = process.env.NODE_ENV
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  )
}

const browserslist = require('browserslist')

// https://github.com/ai/browserslist/blob/master/node.js
if (!browserslist.findConfig(paths.app)) {
  // 默认浏览器配置，移动为先
  // babel-preset-env，Autoprefixer 使用
  process.env.BROWSERSLIST = defConf.browserslist
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
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        // 使用自定义路径
        path: dotenvFile
      })
    )
  }
})

function getEnv(publicUrl) {
  // NODE_ENV，PUBLIC_URL 环境变量为脚手架运行依赖
  // 这里放在 assign 尾部表示顶级含义，不可被覆盖
  const baseEnv = Object.assign({}, maraConf.globalEnv, {
    // 标识开发与生产环境
    // React 内部依赖此变量
    NODE_ENV: process.env.NODE_ENV || 'development',
    // 方便使用公共资源路径
    // 在 js 内，以 process.env.PUBLIC_URL 变量存在
    // html 中可使用 %PUBLIC_URL% 占位符
    // 例：<img src="%PUBLIC_URL%/img/logo.png">
    PUBLIC_URL: publicUrl
  })
  const raw = Object.keys(process.env)
    // 收集当前环境中的自定义环境变量
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

  // raw 给 InterpolateHtmlPlugin 插件使用
  return { raw, stringified }
}

module.exports = getEnv
