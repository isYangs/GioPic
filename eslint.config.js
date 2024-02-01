const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  {
    unocss: true,
    formatters: true,
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'no-console': 'off',
    },
  },
)
