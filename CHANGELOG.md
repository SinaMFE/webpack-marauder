# Changelog

## v1.5.0

* html 内支持 `%PUBLIC_URL%` 占位符获取 `public` 资源地址
* 支持以 `MARA_` 为前缀的自定义环境变量，process.env.MARA_<name>
* maruder.config 支持 `publicDevPath`
* 修复本地服务器 `localhost` 域名限制问题

## v1.4.0

* 合并 支持组件脚手架引入 webpack-marauder
* 加入了组件依赖的 postpublish，用于发布 mjs
* 加入了  文件 ./build/build4comp.js 文件用于做组件 demo 和 umd 的批处理入口

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

