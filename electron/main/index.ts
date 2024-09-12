import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { init as initDB } from '../db'
import { fixElectronCors, initSystem, setupIpcMain } from '../utils/app'
import logger from '../utils/logger'
import setupUpdater from '../utils/update'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1'))
  app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
  app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')
const icon = nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'icon.png'))

async function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 680,
    minWidth: 1050,
    minHeight: 680,
    frame: false,
    icon,
    webPreferences: {
      preload,
      nodeIntegration: true,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: ('detach') })
  }
  else {
    win.loadFile(indexHtml)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url)
    return { action: 'deny' }
  })

  // 设置应用程序名称
  app.setName(app.getName())
  app.dock?.setIcon(icon)

  fixElectronCors(win)
  initDB()
  setupIpcMain(win)
  initSystem(win)
  setupUpdater()
}

function installExtensions() {
  return [
    VUEJS3_DEVTOOLS,
  ].map(extension => installExtension(extension, {
    loadExtensionOptions: { allowFileAccess: true },
  })
    .then(name => logger.info(`[devtools] Added Extension: ${name}.`))
    .catch(err => logger.error(`[devtools] An error occurred: ${err}.`)))
}

app.whenReady().then(async () => {
  await Promise.all(installExtensions())
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (!platform.isMacOS)
    app.quit()
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  }
  else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}${arg}`)
  }
  else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
