/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Modified by Vincent
 */

'use strict'

const chalk = require('chalk')

module.exports = function printBuildError(err) {
  console.log('errr', err)
  const message = err != null && err.message
  const stack = err != null && err.stack

  // Add more helpful message for loader error
  if (typeof message === 'string' && message.indexOf(`Can't resolve`) > -1) {
    const matched = message.match(/Can't resolve '(.*loader)'/)

    if (matched) {
      console.log(`Failed to resolve loader: ${chalk.yellow(matched[1])}\n`)
      console.log('You may need to install the missing loader.\n')
      return
    }
  }

  // Add more helpful message for UglifyJs error
  if (
    stack &&
    typeof message === 'string' &&
    message.indexOf('from UglifyJs') !== -1
  ) {
    try {
      const matched = /(.+)\[(.+):(.+),(.+)\]\[.+\]/.exec(stack)
      if (!matched) {
        throw new Error('Using errors for control flow is bad.')
      }
      const problemPath = matched[2]
      const line = matched[3]
      const column = matched[4]
      console.log(
        'Failed to minify the code from this file: \n\n',
        chalk.yellow(
          `\t${problemPath}:${line}${column !== '0' ? ':' + column : ''}`
        ),
        '\n'
      )
    } catch (ignored) {
      console.log('Failed to minify the bundle.', err)
    }
    console.log('Read more here: http://bit.ly/CRA-build-minify')
  } else {
    console.log((message || err) + '\n')
  }
  console.log()
}
