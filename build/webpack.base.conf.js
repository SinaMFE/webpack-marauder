const path = require('path')
const config = require('./config')
const vueLoaderConfig = require('./vue-loader.conf')
const { assetsPath, getEntries, getProjectConf, rootPath } = require('./utils')
const cwd = process.cwd()
const marauderConfig = getProjectConf()

function resolve(dir) {
  return path.join(cwd, '..', dir)
}

if (process.argus.length == 0) {
  console.log('\x1B[41m%s\x1B[49m', '错误：请传入对应页面名称，如果是嵌套页面则传递view下相对路径')
  throw new Error('请传入对应页面名称，如果是嵌套页面则传递view下相对路径')
  // var entries = getEntries('src/view/**/index.js');
}

const entries = getEntries('src/view/' + process.argus[0] + '/index.js')

module.exports = {
  entry: entries,
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath:
      process.env.NODE_ENV === 'production'
        ? config.build.assetsPublicPath
        : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    modules: [rootPath('src'), rootPath('node_modules')],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      src: resolve('src')
    }
  },
  module: {
    loaders: [{ test: /\.html$/, loader: 'html-withimg-loader' }],
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        options: {
          babelrc: false, // 确保 modules: false生效，tree sharking 必须
          presets: [
            [
              'env',
              {
                modules: false,
                targets: {
                  browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                }
              }
            ],
            'stage-2',
            'react'
          ],
          plugins: ['transform-object-assign']
        }
        // exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 2000,
          name: marauderConfig.hash
            ? assetsPath('img/[name].[hash:7].[ext]')
            : assetsPath('img/[name].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 2000,
          name: assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(ejs|art)$/,
        loader: 'art-template-loader'
      }
    ]
  }
}
