import { build, defineConfig } from 'vite';
import path from 'node:path';
import { resolve } from 'path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import UnoCSS from 'unocss/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
    resolve: {
        alias: [{ find: '~/', replacement: `${resolve(__dirname, 'src')}/` }],
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
        vue(),
        UnoCSS(),
        Components({
            dirs: ['src/components'],
            extensions: ['vue'],
            dts: true,
            resolvers: [NaiveUiResolver()],
        }),
        AutoImport({
            include: [
                /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
                /\.vue$/,
                /\.vue\?vue/,
                /\.md$/,
            ],
            imports: [
                'vue',
                '@vueuse/core',
                'pinia',
                {
                    'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
                },
            ],
        }),
        electron({
            main: {
                entry: 'electron/main.ts',
            },
            preload: {
                input: path.join(__dirname, 'electron/preload.ts'),
            },
            renderer: {},
        }),
    ],
});
