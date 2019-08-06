const path = require('path')
const { getEntries } = require('../utils')
const UNI_SNC = '__UNI_SNC__'
const pkgName = '@mfelibs/universal-framework'

function splitSNC(entryGlob) {
  const sncPath = require.resolve(pkgName)
  const isSNCEntry = (context, request) => {
    const apiPath = path.join(path.dirname(sncPath), '/libs/apis')

    if (!context.includes(apiPath)) return false

    const filePath = path.resolve(context, request)

    return sncPath.includes(filePath)
  }

  const entryConf = getEntries(entryGlob)
  // 从主入口中排除 SNC 依赖
  const externals = [
    {
      [pkgName]: UNI_SNC
    },
    (context, request, callback) => {
      // 排除 universal 内部 apis 对自身的引用
      if (isSNCEntry(context, request)) {
        return callback(null, UNI_SNC)
      }

      callback()
    }
  ]

  // 拆分 SNC，由于依赖 Promise，因此一并添加 polyfills
  entryConf[UNI_SNC] = [
    require.resolve('../../webpack/polyfills'),
    require.resolve('./appSNC')
  ]

  return { entry: entryConf, externals }
}

module.exports = splitSNC
