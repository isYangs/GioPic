import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: true,
  },
  {
    rules: {
      'no-labels': 'off',
      'no-lone-blocks': 'off',
      'no-restricted-syntax': 'off',
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      'vue/no-unused-refs': 'off',
    },
    ignores: [
      'dist/',
      'rebuild.js',
      'vite.config.ts',
    ],
  },
)
