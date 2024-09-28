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
        '~/': `${path.resolve(__dirname, 'src')}/`,
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
          'pinia',
          {
            'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
          },
        ],
      }),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              // eslint-disable-next-line no-console
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
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
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

// https://github.com/WiseLibs/better-sqlite3/blob/v8.5.2/lib/database.js#L36
// https://github.com/WiseLibs/better-sqlite3/blob/v8.5.2/lib/database.js#L50
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
      // https://github.com/vitejs/vite/blob/v4.4.9/packages/vite/src/node/config.ts#L496-L499
      const path$1 = process.platform === 'win32' ? path.win32 : path.posix
      const resolvedRoot = config.root ? path$1.resolve(config.root) : process.cwd()
      const output = path.posix.resolve(resolvedRoot, options.output || 'dist-native')
      const better_sqlite3 = require.resolve('better-sqlite3')
      const better_sqlite3_root = path.posix.join(better_sqlite3.slice(0, better_sqlite3.lastIndexOf('node_modules')), 'node_modules/better-sqlite3')
      const better_sqlite3_node = path.posix.join(better_sqlite3_root, 'build/Release', options.better_sqlite3_node || 'better_sqlite3.node')
      const better_sqlite3_copy = path.posix.join(output, options.better_sqlite3_node || 'better_sqlite3.node')
      if (!fs.existsSync(better_sqlite3_node))
        throw new Error(`${TAG} Can not found "${better_sqlite3_node}".`)

      if (!fs.existsSync(output))
        fs.mkdirSync(output, { recursive: true })

      fs.copyFileSync(better_sqlite3_node, better_sqlite3_copy)
      /** `dist-native/better-sqlite3.node` */
      const BETTER_SQLITE3_BINDING = better_sqlite3_copy.replace(resolvedRoot + path.sep, '')
      fs.writeFileSync(path.join(resolvedRoot, '.env'), `VITE_BETTER_SQLITE3_BINDING=${BETTER_SQLITE3_BINDING}`)
    },
  }
}
