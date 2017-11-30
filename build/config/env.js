const fs = require('fs')
const path = require('path')

// 自定义环境变量前缀
const MARA = /^MARA_/i

function genMixPropsFn(mode) {
  const handle = mode === 'stringify' ? e => JSON.stringify(e) : e => e

  return (env, key, idx, obj) => {
    env[key] = handle(obj[key])
    return env
  }
}

function stringifyObjVal(obj) {
  return Object.keys(obj).reduce(genMixPropsFn('stringify'), {})
}

function getEnv(publicUrl) {
  const baseEnv = {
    // 标识开发与生产环境
    // React 内部依赖此变量
    NODE_ENV: process.env.NODE_ENV || 'development',
    // 方便使用公共资源路径
    // 在 js 内，以 process.env.PUBLIC 变量存在
    // html 中可使用 %PUBLIC% 占位符
    // 例：<img src="%PUBLIC%/img/logo.png">
    PUBLIC: publicUrl
  }
  const raw = Object.keys(process.env)
    // 混合自定义环境变量
    // 为防止环境变量混淆，自定义变量需以 MARA_ 作为前缀
    .filter(key => MARA.test(key))
    .reduce(genMixPropsFn(), baseEnv)

  // DefinePlugin 需要传入序列化参数值
  const stringified = {
    'process.env': stringifyObjVal(raw)
  }

  return { raw, stringified }
}

module.exports = getEnv
