import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'text-overflow': 'text-ellipsis overflow-hidden whitespace-nowrap',
    'flex-center': 'flex items-center justify-center',
  },
  rules: [
    ['font-mono', { 'font-family': 'var(--font-mono)' }],
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    colors: {
      border: 'var(--n-border-color)',
      primary: 'var(--n-text-color)',
    },
  },
})
