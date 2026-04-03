import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: './e2e/support/global-setup.ts',
  outputDir: 'test-results/playwright',
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
