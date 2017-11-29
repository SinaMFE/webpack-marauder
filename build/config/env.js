const fs = require('fs')
const path = require('path')

function stringifyObjVal(obj) {
  return Object.keys(obj).reduce((env, key) => {
    env[key] = JSON.stringify(obj[key])
    return env
  }, {})
}

function getEnv(publicUrl) {
  const raw = {
    // Useful for determining whether we’re running in production mode.
    // Most importantly, it switches React into the correct mode.
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Useful for resolving the correct path to static assets in `public`.
    // For example, <img src={process.env.PUBLIC + '/img/logo.png'} />.
    // This should only be used as an escape hatch. Normally you would put
    // images into the `src` and `import` them in code to get their paths.
    PUBLIC: publicUrl
  }

  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    'process.env': stringifyObjVal(raw)
  }

  return { raw, stringified }
}

module.exports = getEnv
