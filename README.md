# webpack-marauder

[![npm](https://img.shields.io/npm/v/webpack-marauder.svg)](https://www.npmjs.com/package/webpack-marauder)

基于 webpack 的项目打包工具。

`webpack-marauder` 的诞生离不开社区优秀的开源项目，本工具**持续跟进**并融合了 [create-react-app](https://github.com/facebook/create-react-app) 与 [vue-webpack](https://github.com/vuejs-templates/webpack) 的最佳配置，旨在为 `React`，`Vue` 以及 `Vanilla JS` 项目提供**一致性**的构建流程与开发体验。

## 安装

> 注意：本项目使用了 async/await 特性依赖 Node.js 8.0 以上

为了保证多人开发时依赖安装的一致性，推荐使用 [yarn](https://yarnpkg.com/zh-Hans/) 作为包管理工具。

推荐使用本工具配套的脚手架生成项目，`webpack-marauder` 及相关配置已包含在项目模板中。

- [组件脚手架 - spkg](https://github.com/SinaMFE/generator-spkg)
- [项目脚手架 - mcli](https://github.com/SinaMFE/generator-mcli)

### 生成项目结构

@TODO

### 安装依赖

```bash
yarn add webpack-marauder -D
```

### 添加命令

`package.json` 中配置 npm-script

```bash
"scripts": {
   "dev": "marax dev",
   "build": "marax build"
 },
 ...
```

## 命令

### 启动开发环境

运行开发命令将本地启动一个开发服务器，默认基础端口为 `3022`。

```bash
npm run dev [page_name]
```

当为多页应用时，dev 命令需传入参数 `page_name`，指定页面文件夹名称。

示例：

```bash
# 在 index 页面下开发
npm run dev index
```

### 打包项目

执行 `build` 命令打包页面，同 `dev` 命令，当为多页应用时，需指定页面文件夹名称。

```bash
npm run build [page_name]
```

#### FTP 上传

使用 ftp 上传功能，需在 `marauder.config.js` 中注册 ftp 账号信息。

在 `build` 命令基础上，可通过添加 `--ftp` 参数上传打包结果。此外，为方便多分支测试，还可通过可选的 `branch` 参数来指定线上分支路径。

```bash
npm run build [page_name] --ftp [branch]
```

示例：

```bash
#  打包 index 页面，并上传至测试地址
npm run build index --ftp

#  打包 index 页面，并通过上传至测试地址下的 feed_feature 文件夹中
npm run build index --ftp feed_feature
```

#### Test 发布

使用 Test 发布功能，需在 `marauder.config.js` 中注册 gitlab privateToken 信息。

在 `build` 命令基础上，可通过添加 `--test` 参数发布到测试环境。

```bash
npm run build [page_name] --test [tag_message]
```

### 打包 dll 文件

`marauder.config.js` 中配置 `vendor` 信息

```
vendor: ['react', 'react-router']
```

运行 `dll` 命令生成公共资源包，执行结果将会输出到 `dist/vendor` 文件夹下

```bash
npm run dll

# 打包 dll 文件，并上传至文件服务器
npm run dll --ftp
```

### 组件打包

`webpack-marauder` 除了打包项目外，也可作为组件打包工具

在项目 `src` 文件夹中创建 `index.js` 文件作为组件入口

npm-script 中配置

```json
"build": "marax lib"
```

打包

```bash
npm run build
```

打包后文件将在 `lib` 目录中输出

### 启动微信小程序 mpvue 开发环境

`webpack-marauder` 除了可以做普通 web 开发，也支持小程序 mpvue 的开发环境，详情 mpvue 的使用方法见：`http://mpvue.com/`

```json
"wx-dev": "marax wx-dev"
```

```
npm run wx-dev
```

在项目 `src` 中会创建 wx 目录装载基本的 mpvue 的初始脚本，然后会在根目录生成`wx-dist`目录，使用微信开发者工具直接调试此目录即可。

### 微信小程序 mpvue 打包

`json "wx-build": "marax wx-build"`

功能同`wx-dev`，会一次性在`wx-dist`下打包好 mpvue 构建的小程序代码。

## 教程

### 代码分割

#### 动态代码分割

@TODO

#### 静态代码分割

此功能可零配置启用，凡是在 `view/<page_name>/` 下符合命名约定 `index.<chunk_name>.js` 的文件均会被视为 `chunk` 包拆分，拆分后的 bundle 文件以 `<chunk_name>.servant.js` 命名，这里称之为 `servant` 包。

其中 `chunk_name` 为拆分入口的名称，例如 `index.foo.js` 构建后将生成 `foo.servant.js`

`<chunk_name>.servant.js` 文件将只会在生产环境(build)生成，在开发环境(dev)中，所有的 servant 将合并到 entry 中引入。对于使用者来说一切都是无感知的。

**注意**
由于 entry bundle 中已经包含 `polyfill`（Promise，Object.assign），为了避免打包不必要冗余，通过此方式拆分出的 servant 包将不包含 polyfill 内容。为安全起见，建议将 servant 包置于 entry 之后引入（除非您清楚 servant 中不会触发兼容性问题），这也是取名为 `servant` 的本意。`webpack-marauder` 已为您默认配置好一切。

#### 打包 vendor

@TODO
