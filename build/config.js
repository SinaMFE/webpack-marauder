// see http://vuejs-templates.github.io/webpack for documentation.
const path = require('path')

const cwd = process.cwd()

module.exports = {
  entry: 'src/view/*/index.js',
  build: {
    env: {
      NODE_ENV: '"production"'
    },
    index: path.resolve(cwd, 'dist'),
    assetsRoot: path.resolve(cwd, 'dist'),
    assetsSubDirectory: '',
    assetsPublicPath: './',
    productionSourceMap: true,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
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
    env: {
      NODE_ENV: '"development"'
    },
    port: 3022,
    autoOpenBrowser: true,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {},
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  },
  ftp: {
    host: '172.16.142.74', // 主机
    port: 2121,
    user: 'www',
    password: '0ecd15a9fee9dea3',
    reload: true,
    remotePath: {
      version: true
    }
  },
  browserslist: {
    browsers: [
      '> 1%',
      'last 3 versions',
      'ios >= 8',
      'android >= 4.1',
      'not ie <= 8'
    ]
  }
}
