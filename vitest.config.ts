import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const repoRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./packages/integration-tests/test-support/setup-vitest.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        'packages/integration-tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/test-support/**',
      ],
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/*/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'packages/integration-tests/**',
      'node_modules/**',
      'dist/**',
      'dist-electron/**',
    ],
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
      'electron': resolve(repoRoot, 'packages/integration-tests/test-support/mocks/electron.ts'),
      '@electron-toolkit/utils': resolve(repoRoot, 'packages/integration-tests/test-support/mocks/electron-toolkit-utils.ts'),
    },
  },
})
