import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import VueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      exclude: ['**/components/*.vue'],
      dts: 'src/typings/typed-router.d.ts',
      extensions: ['.vue'],
    }),
    vue(),
    UnoCSS(),
    VueDevTools(),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: 'src/typings/components.d.ts',
      resolvers: [NaiveUiResolver()],
    }),
    AutoImport({
      dts: 'src/typings/auto-imports.d.ts',
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
      imports: [
        'vue',
        '@vueuse/core',
        VueRouterAutoImports,
        {
          'vue-router/auto': ['useLink'],
        },
        'pinia',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
    }),
    electron({
      main: {
        entry: 'electron/main/index.ts',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload/index.ts'),
      },
      renderer: {},
    }),
  ],
})
