import type { ElectronApplication, Page } from 'playwright'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'

const require = createRequire(import.meta.url)

const electronPath = require('electron') as string

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mainEntry = path.join(repoRoot, 'dist-electron/main/index.js')

async function waitForMainWindow(electronApp: ElectronApplication) {
  const deadline = Date.now() + 15_000

  while (Date.now() < deadline) {
    const windows = electronApp.windows()

    for (const candidate of windows) {
      try {
        await candidate.getByTestId('desktop-app').waitFor({ timeout: 500 })
        return candidate
      }
      catch {
        continue
      }
    }

    try {
      await electronApp.waitForEvent('window', { timeout: 500 })
    }
    catch {
      continue
    }
  }

  throw new Error('Unable to locate the Electron main window')
}

interface DesktopFixtures {
  electronApp: ElectronApplication
  page: Page
  userDataDir: string
}

export const test = base.extend<DesktopFixtures>({
  userDataDir: async ({ browserName }, use, testInfo) => {
    void browserName
    const dirPath = testInfo.outputPath('.user-data')
    await fs.rm(dirPath, { recursive: true, force: true })
    await fs.mkdir(dirPath, { recursive: true })
    await use(dirPath)
  },

  electronApp: async ({ userDataDir }, use) => {
    const electronApp = await electron.launch({
      executablePath: electronPath,
      args: [mainEntry],
      env: {
        ...process.env,
        GIOPIC_E2E: '1',
        GIOPIC_E2E_USER_DATA: userDataDir,
      },
    })

    await use(electronApp)
    await electronApp.close().catch(() => {})
  },

  page: async ({ electronApp }, use) => {
    const page = await waitForMainWindow(electronApp)
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('desktop-app').waitFor()
    await page.getByTestId('home-page').waitFor()
    await use(page)
  },
})

export { expect }
