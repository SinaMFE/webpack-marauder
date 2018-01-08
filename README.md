# webpack-marauder

[![npm](https://img.shields.io/npm/v/webpack-marauder.svg)](https://www.npmjs.com/package/webpack-marauder)

为了保证多人开发时依赖安装的一致性，推荐使用 [yarn](https://yarnpkg.com/zh-Hans/) 作为包管理工具

## 命令

### 安装依赖

```bash
yarn
```

### 启动开发环境

npm-script 中配置

```json
"dev": "marax dev"
```

运行开发命令将本地启动一个开发服务器，默认基础端口为 `3022`。当为多页应用时，需指定页面文件夹名称。

```bash
npm run dev [page_name]
```

示例：

```bash
# 在 index 页面下开发
npm run dev index
```

### 打包项目

npm-script 中配置

```json
"build": "marax build"
```

执行 `build` 命令打包页面，当为多页应用时，需指定页面文件夹名称。

```bash
npm run build [page_name]
```

#### FTP 上传

_注意，要使用 ftp 上传功能，需在 `marauder.config.js` 中配置好 ftp 服务器信息。_

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

### 打包 dll 文件

npm-script 中配置

```json
"dll": "marax dll"
```

_注意，需在 `marauder.config.js` 中配置 `vendor` 信息。_

运行 `dll` 命令生成公共资源包，执行结果将会输出到 `dist/vendor` 文件夹下

```bash
npm run dll

# 打包 dll 文件，并上传至服务器
npm run dll --ftp

###
```

### 组件打包

marauder 除了打包项目外，也可作为组件打包工具

在项目 src 文件夹中创建 `index.js` 文件作为组件入口

npm-script 中配置

```json
"build": "marax lib"
```

打包

```bash
npm run build
```

打包后文件将在 lib 目录中输出
