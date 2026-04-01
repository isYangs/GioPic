import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG
  const plugins = [
    VueRouter({
      routesFolder: 'src/renderer/pages',
      exclude: ['**/components/*.vue'],
      dts: 'src/renderer/typings/typed-router.d.ts',
      extensions: ['.vue'],
      watch: isServe,
    }),
    vue(),
    UnoCSS(),
    Components({
      dirs: ['src/renderer/components'],
      extensions: ['vue'],
      dts: 'src/renderer/typings/components.d.ts',
      resolvers: [NaiveUiResolver()],
    }),
    AutoImport({
      dts: 'src/renderer/typings/auto-imports.d.ts',
      include: [/\.[tj]s?$/, /\.vue$/, /\.vue\?vue/],
      dirs: [
        'src/renderer/stores',
        'src/renderer/utils',
      ],
      imports: [
        'vue',
        '@vueuse/core',
        VueRouterAutoImports,
        'pinia',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
            'useModal',
          ],
        },
      ],
    }),
    electron({
      main: {
        entry: 'src/main/index.ts',
        onstart({ startup }) {
          if (process.env.VSCODE_DEBUG) {
            console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
          }
          else {
            startup()
          }
        },
        vite: {
          build: {
            sourcemap,
            minify: isBuild,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
            },
          },
          resolve: {
            alias: {
              '@/': `${path.resolve(__dirname,'src')}/`,
            },
          },
        },
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          build: {
            sourcemap: sourcemap ? 'inline' : undefined, // #332
            minify: isBuild,
            outDir: 'dist-electron/preload',
            commonjsOptions: {
              ignoreDynamicRequires: true,
            },
            rollupOptions: {
              external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
            },
          },
          resolve: {
            alias: {
              '@/': `${path.resolve(__dirname,'src')}/`,
            },
          },
        },
      },
    }),
  ]

  if (isServe) {
    const { default: VueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.splice(3, 0, VueDevTools())
  }

  return {
    base: './',
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src/renderer')}/`,
        '@/': `${path.resolve(__dirname,'src')}/`,
      },
    },
    plugins,
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
          return {
            host: url.hostname,
            port: +url.port,
          }
        })()
      : undefined,
    clearScreen: false,
  }
})
