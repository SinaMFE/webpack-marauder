'use strict'

const { cssLoaders, postcssPlugin } = require('./style-loader')
const config = require('../../config')
const { babelLoader } = require('./babel-loader')
const maraConf = require(config.paths.marauder)
const isProd = process.env.NODE_ENV === 'production'

const options = {
  preloaders: {},
  loaders: Object.assign(
    cssLoaders({
      sourceMap: isProd && maraConf.sourceMap,
      extract: isProd,
      vue: true
    }),
    {
      js: babelLoader(isProd)
    }
  ),
  postcss: postcssPlugin,
  preserveWhitespace: false,
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}

// 超级页组件化，解析 data-source
try {
  if (require.resolve('meta-loader')) {
    options.preloaders = {
      html: 'meta-loader'
    }
  }
} catch (e) {}

module.exports = options
