const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  unocss: true,
  formatters: true,

  // ignores: [
  //   'electron/main.ts',
  // ],
})
