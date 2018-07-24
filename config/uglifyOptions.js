module.exports = options => ({
  uglifyOptions: {
    // 强制使用 es5 压缩输出，避免 es6 优化导致兼容性问题
    ecma: 5,
    compress: {
      collapse_vars: false, // 0.3kb
      // Disabled because of an issue with Uglify breaking seemingly valid code:
      // https://github.com/facebook/create-react-app/issues/2376
      // Pending further investigation:
      // https://github.com/mishoo/UglifyJS2/issues/2011
      comparisons: false,
      computed_props: false,
      hoist_funs: false,
      hoist_props: false,
      inline: false,
      loops: false,
      negate_iife: false,
      properties: false,
      reduce_funcs: false,
      reduce_vars: false,

      // a few flags with noticable gains/speed ratio
      // numbers based on out of the box vendor bundle
      booleans: true, // 0.7kb
      sequences: true, // 0.7kb

      // required features to drop conditional branches
      conditionals: true,
      drop_console: options.console
    },
    mangle: {
      safari10: true
    },
    output: {
      // Turned on because emoji and regex is not minified properly using default
      // https://github.com/facebook/create-react-app/issues/2488
      ascii_only: true
    }
  },
  sourceMap: options.sourceMap,
  cache: true,
  parallel: true
})
