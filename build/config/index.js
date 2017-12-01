const paths = require('./paths')
const getEnv = require('./env')
const { ensureSlash } = require('../utils/utils')
const maraConf = require(paths.marauder)

function getServedPath(publicUrl) {
  // 强制以 / 结尾，为了兼容 publicPath: '.'
  return publicUrl ? ensureSlash(publicUrl, true) : '/'
}

const publicPath = getServedPath(maraConf.publicPath)
const publicDevPath = getServedPath(maraConf.publicDevPath)

module.exports = {
  hash: {
    main: true,
    chunk: true,
    assets: true
  },
  // 压缩配置
  compress: {
    // 移除 console
    drop_console: false
  },
  entry: 'src/view/*/index.js',
  // 通知 babel 编译 node_module 里额外的模块
  esm: ['@mfelibs'],
  // 打包 dll
  vendor: [],
  paths: paths,
  build: {
    env: getEnv(publicPath.slice(0, -1)),
    assetsPublicPath: publicPath,
    productionGzipExtensions: ['js', 'css'],
    // Run the build command with an extra argument to
    // View the bundle analyzer report after build finishes:
    // `npm run build --report`
    // Set to `true` or `false` to always turn it on or off
    bundleAnalyzerReport: process.env.npm_config_report,
    // upload bundle use ftp
    // `npm run build <page> --ftp [namespace]`
    // Set to `true` or `false` to always turn it on or off
    uploadFtp: process.env.npm_config_ftp
  },
  dev: {
    env: getEnv(publicDevPath.slice(0, -1)),
    port: 3022,
    assetsPublicPath: publicDevPath,
    proxyTable: {},
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  },
  ftp: Object.assign(
    {
      host: '', // 主机
      port: 0,
      user: '',
      password: '',
      reload: true, // 刷新缓存
      openBrowser: true, // 上传完毕后自动打开浏览器
      remotePath: {
        version: true // 添加 version 路径
      }
    },
    maraConf.ftp
  ),
  // hybrid 项目配置，存在此属性时，将会生成 zip 包
  hybrid: {},
  browserslist: {
    browsers: [
      '> 1%',
      'last 4 versions',
      'ios >= 8',
      'android >= 4.1',
      'not ie < 9'
    ],
    flexbox: 'no-2009'
  }
}
