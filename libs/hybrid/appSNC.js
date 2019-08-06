// 包名后添加任意参数，防止被 externals 排除
// @TODO 使用 rollup 预编译，读取 lib 目录
import appSNC from '@mfelibs/universal-framework?uni=1'

window['__UNI_SNC__'] = appSNC
