const path = require('path')
const { getEntries } = require('../utils')
const UNI_SNC = '__UNI_SNC__'

function isSNCEntry(context, request) {
  const sncPath = require.resolve('@mfelibs/universal-framework')
  const apiPath = path.join(path.dirname(sncPath), '/libs/apis')

  if (!context.includes(apiPath)) return false

  const filePath = path.resolve(context, request)

  return sncPath.includes(filePath)
}

function getCommonPkgConf(entryGlob) {
  const commonPkg = require.resolve('@mfelibs/hybridcontainer')
  const commonPkgPath = path.join(
    path.dirname(commonPkg),
    '../dist/index/static/js/index.min.js'
  )
  const moduleMap = require('@mfelibs/hybridcontainer')
  const entryConf = getEntries(entryGlob)
  // 从主入口中排除 SNC 依赖
  const externals = [
    moduleMap,
    (context, request, callback) => {
      // 排除 universal 内部 apis 对自身的引用
      if (isSNCEntry(context, request)) {
        return callback(null, moduleMap['@mfelibs/universal-framework'])
      }

      callback()
    }
  ]

  // // 拆分 SNC，由于依赖 Promise，因此一并添加 polyfills
  // entryConf[UNI_SNC] = [
  //   require.resolve('../../webpack/polyfills'),
  //   require.resolve('./appSNC')
  // ]

  return { entry: entryConf, externals, commonPkgPath }
}

module.exports = getCommonPkgConf
