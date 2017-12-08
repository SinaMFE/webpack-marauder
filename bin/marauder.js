#!/usr/bin/env node

'use strict'

const spawn = require('react-dev-utils/crossSpawn')
const args = process.argv.slice(2)

const cmdMap = {
  dev: 'dev-server',
  test: 'test',
  build: 'build',
  comp: 'build4comp',
  dll: 'dll'
}
const equalsCmd = cmd => cmdMap.hasOwnProperty(cmd)
const scriptIndex = args.findIndex(equalsCmd)
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : []

if (equalsCmd(script)) {
  const result = spawn.sync(
    'node',
    nodeArgs
      .concat(require.resolve('../build/' + cmdMap[script]))
      .concat(args.slice(scriptIndex + 1)),
    { stdio: 'inherit' }
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
} else {
  console.log('Unknown script "' + script + '".')
  console.log('Perhaps you need to update webpack-marauder?')
  console.log(
    'See: https://github.com/SinaMFE/webpack-marauder/blob/master/README.md'
  )
}
