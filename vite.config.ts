import fs from 'node:fs'
import { createRequire } from 'node:module'
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
import { defineConfig, type Plugin } from 'vite'
import electron from 'vite-plugin-electron/simple'
import VueDevTools from 'vite-plugin-vue-devtools'
import pkg from './package.json'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src/renderer')}/`,
        '@/': `${path.resolve(__dirname,'src')}/`,
      },
    },
    plugins: [
      VueRouter({
        routesFolder: 'src/renderer/pages',
        exclude: ['**/components/*.vue'],
        dts: 'src/renderer/typings/typed-router.d.ts',
        extensions: ['.vue'],
      }),
      vue(),
      UnoCSS(),
      VueDevTools(),
      Components({
        dirs: ['src/renderer/components'],
        extensions: ['vue'],
        dts: 'src/renderer/typings/components.d.ts',
        resolvers: [NaiveUiResolver()],
      }),
      AutoImport({
        dts: 'src/renderer/typings/auto-imports.d.ts',
        include: [/\.[tj]s?$/, /\.vue$/, /\.vue\?vue/],
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
      bindingSqlite3(),
    ],
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

function bindingSqlite3(options: {
  output?: string
  better_sqlite3_node?: string
  command?: string
} = {}): Plugin {
  const TAG = '[vite-plugin-binding-sqlite3]'
  options.output ??= 'dist-native'
  options.better_sqlite3_node ??= 'better_sqlite3.node'
  options.command ??= 'build'

  return {
    name: 'vite-plugin-binding-sqlite3',
    config(config) {
      const pathUtils = process.platform === 'win32' ? path.win32 : path.posix
      const rootDir = pathUtils.resolve(config.root || process.cwd())
      const outputDir = pathUtils.join(rootDir, options.output || 'dist-native')

      const bs3NodePath = path.posix.join(
        require.resolve('better-sqlite3').replace(/node_modules.*/, 'node_modules/better-sqlite3'),
        'build/Release',
        options.better_sqlite3_node || 'better_sqlite3.node',
      )

      if (!fs.existsSync(bs3NodePath)) {
        throw new Error(`${TAG} Cannot find "${bs3NodePath}".`)
      }

      const bs3OutputPath = pathUtils.join(outputDir, options.better_sqlite3_node || 'better_sqlite3.node')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      fs.copyFileSync(bs3NodePath, bs3OutputPath)

      fs.writeFileSync(
        pathUtils.join(rootDir, '.env'),
        `VITE_BETTER_SQLITE3_BINDING=${bs3OutputPath.replace(`${rootDir}${pathUtils.sep}`, '')}`,
      )
    },
  }
}
