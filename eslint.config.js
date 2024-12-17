import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
    unocss: true,
    formatters: true,

    rules: {
      'unused-imports/no-unused-imports': 'error',
      'node/prefer-global/process': 'off',
    },

    ignores: [
      '.vscode/*',
      'dist/*',
      'rebuild.js',
      'vite.config.ts',
    ],
  },
)
