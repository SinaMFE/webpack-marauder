/**
 * https://github.com/webpack/webpack/blob/master/lib/ProgressPlugin.js
 *
 * MIT License http://www.opensource.org/licenses/mit-license.php
 * Author Tobias Koppers @sokra
 *
 * Modified by Vincent
 */

'use strict'

let lineCaretPosition = 0

function progressHandler(percentage, msg, ...args) {
  const details = args
  if (percentage < 1) {
    percentage = Math.floor(percentage * 100)
    msg = `${percentage}% ${msg}`
    if (percentage < 100) {
      msg = ` ${msg}`
    }
    if (percentage < 10) {
      msg = ` ${msg}`
    }

    for (let detail of details) {
      if (!detail) continue
      if (detail.length > 40) {
        detail = '...'
      }
      msg += ` ${detail}`
    }
  }

  goToLineStart(msg)
  process.stderr.write(msg)
}

function goToLineStart(nextMessage) {
  let str = ''
  for (; lineCaretPosition > nextMessage.length; lineCaretPosition--) {
    str += '\b \b'
  }
  for (var i = 0; i < lineCaretPosition; i++) {
    str += '\b'
  }
  lineCaretPosition = nextMessage.length
  if (str) process.stderr.write(str)
}

module.exports = progressHandler
