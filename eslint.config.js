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
      'vue/attribute-hyphenation': 'warn',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': ['warn', 2],
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'beside',
        multiline: 'below',
      }],
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always',
      }],
      'vue/component-name-in-template-casing': ['error', 'kebab-case', {
        registeredComponentsOnly: false,
      }],
    },

    ignores: [
      '.vscode/*',
      'dist/*',
      'rebuild.js',
      'vite.config.ts',
    ],
  },
)
