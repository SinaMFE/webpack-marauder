# Changelog

## v1.6.0

* 支持 启用作用域提升插件（`ModuleConcatenationPlugin`）
* 支持 hybrid 项目使用 ftp 上传到开发环境
* 优化 更新项目依赖
* 修复 `UMD` 模块输出入口错误问题
* 修复 静态资源强制使用 `hash` 后缀，防止重名
* 修复 使用 `postcss-url` 解决 css 资源路径层级错误问题

## v1.5.0

* 支持 maruder.conf 配置 globalEnv 注入全局变量
* 支持 html 内 `%PUBLIC_URL%` 占位符获取 `public` 资源地址
* 支持 以 `MARA_` 为前缀的自定义环境变量，process.env.MARA\_<name>
* 支持 maruder.config 配置 `publicDevPath`
* 修复 本地服务器 `localhost` 域名限制问题
* 优化 使用 `~` 作为 `src` 根目录别名
* 支持 `.env` 文件管理环境变量
* 支持 maruder.config 配置 `https`

## v1.4.0

* 支持 组件打包(build4comp.js)
* 支持 使用 postpublish 钩子，发布至 CDN

## v1.2.0

* 支持 页面级 public 资源
* 支持 `dll` 打包
* 优化 打包速度，错误堆栈显示
* 优化 打包结果资源按类型目录分类
* 优化 单页面时，`dev` 与 `build` 命令可省略页面名

## v1.1.0

* 支持 文件变动，自动刷新浏览器
* 支持 样式自动添加厂商前缀
* 支持 `cssnext` 特性，css 文件 import 导入
* 支持 bundle 包版本日期注释信息
* 支持 `ftp` 上传项目到测试服务器
* 优化 端口号防冲，默认向后累加
* 修复 `dev` 下模式自动打开浏览器后，终端进程不退出问题
