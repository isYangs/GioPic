import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
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
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
    presetRemToPx(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'text-overflow': 'text-ellipsis overflow-hidden whitespace-nowrap',
    'flex-center': 'flex items-center justify-center',
    'widgets-btn': 'w40px h40px flex-center bg-[#20202a] dark:(bg-[#f0f0f0] text-black) rounded-6px text-white select-none',

  },
  rules: [['object-center', { 'object-position': 'center' }]],
  transformers: [
    transformerDirectives(),
  ],
})
