import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./packages/test-suite/test-support/setup-vitest.ts'],
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
        'test/',
        'tests/',
      ],
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src/renderer'),
      '@': resolve(__dirname, './src'),
      '@giopic/core': resolve(__dirname, './packages/core/src'),
      'electron': resolve(__dirname, './packages/test-suite/test-support/mocks/electron.ts'),
      '@electron-toolkit/utils': resolve(__dirname, './packages/test-suite/test-support/mocks/electron-toolkit-utils.ts'),
    },
  },
})
