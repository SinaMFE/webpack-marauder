const { cssLoaders } = require('./style-loader')
const config = require('../../config')
const { nodeModulesRegExp } = require('../../utils/utils')
const maraConf = require(config.paths.marauder)
const isProd = process.env.NODE_ENV === 'production'

function babelExternalMoudles(esm) {
  if (!(esm && esm.length)) return nodeModulesRegExp(config.esm)

  // 当 esm 为 all 时，编译 node_modules 下所有模块
  if (esm === 'all') esm = ''

  return nodeModulesRegExp([].concat(config.esm, esm))
}

module.exports = {
  loaders: Object.assign(
    cssLoaders({
      sourceMap: isProd && maraConf.sourceMap,
      extract: isProd,
      minimize: isProd,
      vue: true
    }),
    {
      js: {
        include: [config.paths.src, config.paths.test].concat(
          babelExternalMoudles(maraConf.esm)
        ),
        loader: require.resolve('babel-loader'),
        options: {
          babelrc: false,
          presets: ['babel-preset-react-app'],
          compact: isProd,
          // `babel-loader` 特性
          // 在 ./node_modules/.cache/babel-loader/ 中缓存执行结果
          // 提升性能
          cacheDirectory: !isProd
        }
      }
    }
  ),
  transformToRequire: {
    video: 'src',
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}
