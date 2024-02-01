import { defineConfig, presetUno, presetAttributify, presetIcons, transformerDirectives } from 'unocss'
import presetRemToPx from '@unocss/preset-rem-to-px'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        height: '20px',
        width: '20px',
        'vertical-align': 'text-bottom',
      },
    }),
    presetRemToPx(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'bg-base': 'bg-white dark:bg-[#10101a]',
    'text-base': 'text-light-900 dark:text-[#f0f0f0]',
    'font-base': 'font-medium text-sm text-base',
    'text-overflow': 'text-ellipsis overflow-hidden whitespace-nowrap',
    'flex-center': 'flex items-center justify-center',
    'flex-col': 'flex flex-col',
    'widgets-btn':
      'w40px h40px flex-center bg-[#20202a] dark:(bg-[#f0f0f0] text-black) rounded-6px text-white select-none',
  },
  rules: [['object-center', { 'object-position': 'center' }]],
  transformers: [transformerDirectives()],
})
