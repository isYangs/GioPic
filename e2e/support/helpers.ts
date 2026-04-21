import type { ElectronApplication, Locator, Page } from 'playwright'
import { Buffer } from 'node:buffer'

const samplePngBytes = Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9VEWilQAAAAASUVORK5CYII=',
    'base64',
  ),
)

const baseProgramId = 2_026_040_200

export function createProgramSeed(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: baseProgramId,
    type: 's3',
    name: 'E2E S3',
    detail: {
      region: 'us-east-1',
      bucketName: 'e2e-bucket',
      endpoint: '',
      forcePathStyle: false,
      acl: 'public-read',
    },
    pluginId: 'giopic-s3',
    icon: '',
    ...overrides,
  }
}

export async function seedDesktopState(page: Page, payload: Record<string, any>) {
  await page.evaluate(async (state) => {
    await window.ipcRenderer.invoke('e2e:seed-state', state)
  }, payload)
}

export async function setUploadMock(page: Page, config: Record<string, any> = {}) {
  await page.evaluate(async (mockConfig) => {
    await window.ipcRenderer.invoke('e2e:set-upload-mock', mockConfig)
  }, config)
}

export async function dropSampleImage(page: Page, target: Locator, fileName: string = 'e2e-image.png') {
  const dataTransfer = await page.evaluateHandle(
    ({ bytes, fileName }) => {
      const file = new File([new Uint8Array(bytes)], fileName, { type: 'image/png' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      return dataTransfer
    },
    { bytes: samplePngBytes, fileName },
  )

  await target.dispatchEvent('dragenter', { dataTransfer })
  await target.dispatchEvent('dragover', { dataTransfer })
  await target.dispatchEvent('drop', { dataTransfer })
  await dataTransfer.dispose()
}

export async function getMainWindowState(electronApp: ElectronApplication) {
  return electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows()
      .find(window => !window.webContents.getURL().includes('loading.html'))

    if (!mainWindow) {
      return null
    }

    return {
      isVisible: mainWindow.isVisible(),
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      url: mainWindow.webContents.getURL(),
    }
  })
}

export async function restoreMainWindow(electronApp: ElectronApplication) {
  await electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows()
      .find(window => !window.webContents.getURL().includes('loading.html'))

    if (!mainWindow) {
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    mainWindow.show()
    mainWindow.focus()
  })
}
