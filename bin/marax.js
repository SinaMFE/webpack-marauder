#!/usr/bin/env node

'use strict'

const chalk = require('chalk')
const semver = require('semver')
const requiredVersion = require('../package.json').engines.node

if (!semver.satisfies(process.version, requiredVersion)) {
  console.log(
    chalk.red(
      `You are using Node ${
        process.version
      }, but vue-cli-service requires Node ${requiredVersion}.\nPlease upgrade your Node version.\n`
    )
  )
  process.exit(1)
}

// https://www.npmjs.com/package/cross-spawn
const spawn = require('react-dev-utils/crossSpawn')
const { buffer2String } = require('../libs/utils')
const paths = require('../config/paths')
// args 是当前 bin 脚本的参数，为 bin 以后的内容
// 如 marax build index，args: ['build', 'index']
const args = process.argv.slice(2)

const cmdMap = {
  'wx-dev': 'wx-dev-server',
  'wx-build': 'wx-build',
  dev: 'dev-server',
  test: 'test',
  build: 'build',
  lib: 'build4comp',
  dll: 'dll',
  '-V': 'version',
  '-v': 'version'
}
const equalsCmd = cmd => cmdMap.hasOwnProperty(cmd)
const scriptIndex = args.findIndex(equalsCmd)
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]
// bin 命令与 cmd 之间的内容为 nodeArgs
// 如 marax x build index，nodeArgs: ['x']
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : []
// cmd 之后的内容为 cmdArgs
// marax build index，cmdArgs: ['index']
const cmdArgs = args.slice(scriptIndex + 1)
const mArgs = require('minimist')(args)

if (mArgs.wap) {
  process.env.jsbridgeBuildType = 'wap'
} else if (mArgs.app) {
  process.env.jsbridgeBuildType = 'app'
}

process.env.compileModel = 'build'
if (mArgs.dev) {
  process.env.compileModel = 'dev'
} 


if (!equalsCmd(script)) {
  console.log('\nUnknown script "' + script + '".')
  console.log('Perhaps you need to update webpack-marauder?')
  console.log(
    'See: https://github.com/SinaMFE/webpack-marauder/blob/master/README.md'
  )
  process.exit(0)
}

function version(output) {
  console.log(require(paths.ownPackageJson).version, '\n')

  if (output !== 'all') return

  const npm = spawn('npm', ['info', 'webpack-marauder', 'dist-tags'])
  const res = new Promise((resolve, reject) => {
    npm.stdout.on('data', data => resolve(buffer2String(data)))
    npm.stderr.on('data', data => reject(buffer2String(data)))
  })

  console.log('dist-tags:')
  return res.then(data => {
    const arr = data.replace(/[{}]/g, '').split(',')
    return arr.map(tag => console.log(`  ${tag}`))
  })
}

if (script === '-v') {
  version()
} else if (script === '-V') {
  version('all')
} else {
  const result = spawn.sync(
    'node',
    nodeArgs
      .concat(require.resolve('../build/' + cmdMap[script]))
      .concat(cmdArgs),
    {
      stdio: 'inherit'
    }
  )
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      )
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      )
    }
    process.exit(1)
  }
  process.exit(result.status)
}
