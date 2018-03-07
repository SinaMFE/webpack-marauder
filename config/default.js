'use strict'

module.exports = {
  hash: {
    main: true,
    chunk: true
  },
  library: {
    root: 'MyLibrary',
    amd: '',
    commonjs: ''
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
  build: {},
  dev: {
    port: 3022,
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  },
  ftp: {
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
  // hybrid 项目配置，存在此属性时，将会生成 zip 包
  hybrid: {},
  browserslist: [
    '> 1%',
    'last 4 versions',
    'ios >= 8',
    'android >= 4.1',
    'not ie < 9'
  ],
  postcss: {
    // 允许 flexbox 2009 以支持多行超出省略
    // https://github.com/jonathantneal/postcss-preset-env/blob/master/lib/plugins-by-specification-id.js
    features: {
      // image-set polyfill 与雪碧图使用时存在 bug，在此禁用
      'css-images-image-set-notation': false
    }
  }
}
