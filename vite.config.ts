import fs from 'node:fs'
import path from 'node:path'
import { type Plugin, defineConfig, normalizePath } from 'vite'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
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
        entry: 'electron/main.ts',
        vite: {
          build: {
            minify: false,
            commonjsOptions: {
              ignoreDynamicRequires: true,
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
    }),
    bindingSqlite3(),
  ],
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
      const resolvedRoot = normalizePath(config.root ? path.resolve(config.root) : process.cwd())
      const output = path.posix.resolve(resolvedRoot, options.output)
      const better_sqlite3 = require.resolve('better-sqlite3')
      const better_sqlite3_root = path.posix.join(better_sqlite3.slice(0, better_sqlite3.lastIndexOf('node_modules')), 'node_modules/better-sqlite3')
      const better_sqlite3_node = path.posix.join(better_sqlite3_root, 'build/Release', options.better_sqlite3_node)
      const better_sqlite3_copy = path.posix.join(output, options.better_sqlite3_node)
      if (!fs.existsSync(better_sqlite3_node))
        throw new Error(`${TAG} Can not found "${better_sqlite3_node}".`)

      if (!fs.existsSync(output))
        fs.mkdirSync(output, { recursive: true })

      fs.copyFileSync(better_sqlite3_node, better_sqlite3_copy)
      /** `dist-native/better_sqlite3.node` */
      const BETTER_SQLITE3_BINDING = better_sqlite3_copy.replace(`${resolvedRoot}/`, '')
      fs.writeFileSync(path.join(resolvedRoot, '.env'), `VITE_BETTER_SQLITE3_BINDING=${BETTER_SQLITE3_BINDING}`)

      console.log(TAG, `binding to ${BETTER_SQLITE3_BINDING}`)
    },
  }
}
