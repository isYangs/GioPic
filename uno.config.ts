import presetRemToPx from '@unocss/preset-rem-to-px'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetRemToPx(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'text-overflow': 'text-ellipsis overflow-hidden whitespace-nowrap',
    'flex-center': 'flex items-center justify-center',
  },
  rules: [
    ['object-center', { 'object-position': 'center' }],
    ['font-mono', { 'font-family': 'var(--font-mono)' }],
  ],
  transformers: [
    transformerDirectives(),
  ],
})
