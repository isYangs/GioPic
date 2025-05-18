import type { BrowserWindowConstructorOptions } from 'electron'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from '@electron-toolkit/utils'
import { app, BrowserWindow, nativeImage, shell } from 'electron'
import { init as initDB } from './db'
import { registerIpc } from './ipc'
import createAppUpdater from './services/AppUpdater'
import createShortcutService from './services/ShortcutService'
import createTrayService from './services/TrayService'
import createWindowService from './services/WindowService'
import { initStore } from './utils/store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

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

Object.defineProperty(app, 'isPackaged', {
  get() {
    return true
  },
  configurable: false,
})

let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

const iconPath = path.join(process.env.VITE_PUBLIC, platform.isMacOS ? 'icon-mac.png' : 'icon.png')
const icon = nativeImage.createFromPath(iconPath)

export function createWindow(options: BrowserWindowConstructorOptions = {}) {
  const defaultOptions: BrowserWindowConstructorOptions = {
    title: app.getName(),
    width: 1080,
    height: 680,
    minWidth: 1050,
    minHeight: 680,
    frame: false,
    icon,
    webPreferences: {
      preload,
      sandbox: false,
      // 禁用拼写检查
      spellcheck: false,
      // 禁用同源策略
      webSecurity: false,
      // 允许 HTTP
      allowRunningInsecureContent: true,
      // 启用 Node.js
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      // 启用上下文隔离
      contextIsolation: true,
    },
  }
  options = Object.assign(defaultOptions, options)
  const win = new BrowserWindow(options)
  return win
}

async function createMainWindow() {
  mainWindow = createWindow({
    width: 1080,
    height: 680,
    minWidth: 1050,
    minHeight: 680,
    show: false,
    icon,
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  }
  else {
    mainWindow.loadFile(indexHtml)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url)
    return { action: 'deny' }
  })

  app.dock?.setIcon(icon)

  registerIpc(mainWindow, loadingWindow)
  createTrayService(mainWindow)
  createShortcutService(mainWindow)
  createWindowService(mainWindow)
  initStore()
  initDB()
  createAppUpdater(mainWindow)
}

async function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 800,
    height: 460,
    maxWidth: 800,
    maxHeight: 460,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload,
      contextIsolation: true,
    },
  })

  const loadingHtml = path.join(__dirname, '../../web/loading.html')
  await loadingWindow.loadFile(loadingHtml)
}

app.whenReady().then(async () => {
  app.commandLine.appendSwitch('disable-features', 'SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,PrivacySandboxAdsAPIs')
  app.commandLine.appendSwitch('enable-features', 'AllowSyncXHRInPageDismissal')

  await createLoadingWindow()
  await createMainWindow()
  if (mainWindow) {
    mainWindow.hide()
  }
})

app.on('window-all-closed', () => {
  mainWindow = null
  if (!platform.isMacOS)
    app.quit()
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized())
      mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  }
  else {
    createMainWindow()
  }
})

app.on('before-quit', () => {
  if (import.meta.env.DEV) {
    app.exit()
  }
})
