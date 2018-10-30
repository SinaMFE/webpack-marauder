'use strict'

const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier')
const { rootPath } = require('../../libs/utils')
const isProd = process.env.NODE_ENV === 'production'

const vueLoaderCacheConfig = {
  cacheDirectory: rootPath('node_modules/.cache/vue-loader'),
  cacheIdentifier: getCacheIdentifier(isProd ? 'production' : 'development', [
    'vue-loader',
    '@vue/component-compiler-utils',
    'vue-template-compiler'
  ])
}

const vueLoaderOptions = Object.assign(
  {
    preloaders: {},
    compilerOptions: {
      preserveWhitespace: false
    },
    transformAssetUrls: {
      video: ['src', 'poster'],
      source: 'src',
      img: 'src',
      image: 'xlink:href'
    }
  },
  vueLoaderCacheConfig
)

// 超级页组件化，解析 data-source
try {
  if (require.resolve('meta-loader')) {
    vueLoaderOptions.preloaders = {
      html: 'meta-loader'
    }
  }
} catch (e) {}

module.exports = { vueLoaderOptions, vueLoaderCacheConfig }
