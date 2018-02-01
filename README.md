# webpack-marauder

[![npm](https://img.shields.io/npm/v/webpack-marauder.svg)](https://www.npmjs.com/package/webpack-marauder)

基于 webpack 的项目打包工具。

`webpack-marauder` 的诞生离不开社区优秀的开源项目，本工具**持续跟进**并融合了 [create-react-app](https://github.com/facebook/create-react-app) 与 [vue-webpack](https://github.com/vuejs-templates/webpack) 的最佳配置，旨在为 `React`，`Vue` 以及纯 `Vanilla JS` 项目提供**一致性**的构建流程与开发体验。

## 安装

为了保证多人开发时依赖安装的一致性，推荐使用 [yarn](https://yarnpkg.com/zh-Hans/) 作为包管理工具。

推荐使用本工具配套的脚手架生成项目，`webpack-marauder` 及相关配置已包含在项目模板中。

* [组件脚手架 - spkg](https://github.com/SinaMFE/generator-spkg)
* [项目脚手架 - mcli](https://github.com/SinaMFE/generator-mcli)

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

**注意：由于 `yarn` 无法获取自定义参数，请使用 `npm run` 运行本命令**

示例：

```bash
#  打包 index 页面，并上传至测试地址
npm run build index --ftp

#  打包 index 页面，并通过上传至测试地址下的 feed_feature 文件夹中
npm run build index --ftp feed_feature
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
