import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const repoRoot = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test-support/setup-vitest.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'test-support/',
      ],
    },
    include: ['specs/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '~': resolve(repoRoot, 'src/renderer'),
      '@': resolve(repoRoot, 'src'),
      '@giopic/core': resolve(repoRoot, 'packages/core/src'),
      '@pkg-core': resolve(repoRoot, 'packages/core/src'),
      '@pkg-lsky': resolve(repoRoot, 'packages/lsky-plugin/src'),
      '@pkg-lskypro': resolve(repoRoot, 'packages/lskypro-plugin/src'),
      '@pkg-s3': resolve(repoRoot, 'packages/s3-plugin/src'),
      'electron': resolve(__dirname, './test-support/mocks/electron.ts'),
      '@electron-toolkit/utils': resolve(__dirname, './test-support/mocks/electron-toolkit-utils.ts'),
    },
  },
})
