import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
} from 'unocss'
import presetRemToPx from '@unocss/preset-rem-to-px'

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
  rules: [['object-center', { 'object-position': 'center' }]],
  transformers: [
    transformerDirectives(),
  ],
})
