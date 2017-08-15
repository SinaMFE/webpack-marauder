const fs = require('fs')
const path = require('path')
const glob = require('glob')
const devIp = require('dev-ip')
const portscanner = require('portscanner')
const config = require('./config.js')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

/**
 * 获取静态资源路径
 * @param  {String} _path 拼接路径
 * @return {String}       完整路径
 */
exports.assetsPath = function(_path) {
  const assetsSubDirectory =
    process.env.NODE_ENV === 'production'
      ? config.build.assetsSubDirectory
      : config.dev.assetsSubDirectory
  return path.posix.join(assetsSubDirectory, _path)
}

/**
 * 生成 css loader 配置集合
 * @param  {Object} options 配置参数
 * @return {Object}         结果对象
 */
exports.cssLoaders = function(options) {
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      // 启用压缩
      minimize: process.env.NODE_ENV === 'production',
      // 启用 sourceMap
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders(loader, loaderOptions) {
    let loaders = [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    return wrapLoader(options, loaders)
  }

  // http://vuejs.github.io/vue-loader/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass')
  }
}

// Extract CSS when that option is specified
// (which is the case during production build)
function wrapLoader(options, loaders) {
  if (options.extract) {
    return ExtractTextPlugin.extract({
      use: loaders,
      fallback: 'vue-style-loader'
    })
  } else {
    // dev 模式下都会先经过 vue-style-loader 处理
    return ['vue-style-loader'].concat(loaders)
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function(options) {
  let output = []
  const loaders = exports.cssLoaders(options)
  const normalLoaders = [
    {
      loader: 'css-loader',
      options: { importLoaders: 1 }
    },
    {
      loader: 'postcss-loader',
      options: {
        plugins: [
          require('postcss-import')(),
          require('postcss-cssnext')(config.browserslist)
        ],
        sourceMap: options.sourceMap
      }
    }
  ]

  loaders.css = wrapLoader(options, normalLoaders)

  for (let extension in loaders) {
    const loader = loaders[extension]

    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  return output
}

/**
 * 获取入口文件名列表
 * @return {Array} 入口名数组
 */
exports.getPageList = function() {
  const entries = exports.getEntries(`${process.cwd()}/${config.entry}`)
  return Object.keys(entries)
}

/**
 * 获取本机局域网 ip
 * @return {String} ip
 */
exports.localIp = function() {
  const ip = devIp()
  // vpn 下 ip 为数组，第一个元素为本机局域网 ip
  // 第二个元素为 vpn 远程局域网 ip
  return Array.isArray(ip) ? ip[0] : ip
}

/**
 * 获取空闲端口号，范围 [start, start + 20]
 * @return {Number} 端口号
 */
exports.getFreePort = async function() {
  const defPort = process.env.PORT || config.dev.port
  const ceiling = Number(defPort + 20)

  return portscanner.findAPortNotInUse(defPort, ceiling, exports.localIp())
}

/**
 * 获取指定路径下的入口文件
 * @param  {String} globPath 通配符路径
 * @return {Object}          入口名:路径 键值对
 */
exports.getEntries = function(globPath) {
  const files = glob.sync(exports.rootPath(globPath))
  const entries = {}

  files.forEach(function(filepath) {
    const dirname = path.dirname(path.relative('src/view/', filepath))
    entries[dirname] = filepath
  })

  return entries
}

/**
 * 获取顶级项目配置
 * @return {Object} 项目配置对象
 */
exports.getProjectConf = function() {
  return require(exports.rootPath('marauder.config.js'))
}

/**
 * 获取绝对路径
 * @param  {String} filePath 拼接路径
 * @return {String}          绝对路径
 */
exports.rootPath = function(filePath) {
  return path.resolve(process.cwd(), filePath)
}

/**
 * 解析日期
 * @param  {Date | Number} target 日期对象或时间戳
 * @return {Object}        结果对象
 */
exports.parseDate = function(target) {
  const f = n => (n > 9 ? n : '0' + n)
  const date = target instanceof Date ? target : new Date(target)
  return {
    y: date.getFullYear(),
    M: f(date.getMonth() + 1),
    d: f(date.getDate()),
    h: f(date.getHours()),
    m: f(date.getMinutes()),
    s: f(date.getSeconds())
  }
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param  {Date | Number} dt 日期对象或时间戳
 * @return {String}    格式化结果
 */
exports.pubDate = function(dt) {
  const date = exports.parseDate(dt)
  return `${date.y}-${date.M}-${date.d}`
}

/**
 * 生成 banner
 * @return {String} 包含项目版本号，构建日期
 */
exports.banner = function() {
  return (
    `@version ${process.env.npm_package_version}\n` +
    `@date ${exports.pubDate(new Date())}`
  )
}
