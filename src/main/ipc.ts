import type { BrowserWindow } from 'electron'
import type { SupportedUploader } from './services/beds'
import { app, ipcMain } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from './db/modules'
import { uploaders } from './services/beds'
import createShortcutService from './services/ShortcutService'
import createWindowService from './services/WindowService'
import logger from './utils/logger'

export function registerIpc(win: BrowserWindow, loadingWindow: BrowserWindow | null) {
  // ---------- 窗口操作 ----------
  ipcMain.handle('window-min', () => win.minimize())

  ipcMain.handle('window-maxOrRestore', () => {
    if (win.isMaximized())
      win.unmaximize()
    else
      win.maximize()
    return win.isMaximized()
  })

  ipcMain.handle('window-hide', () => win.hide())
  ipcMain.handle('window-close', () => {
    app.quit()
    win.close()
  })
  ipcMain.handle('window-show', () => win.show())
  ipcMain.handle('app-version', () => app.getVersion())

  ipcMain.on('win-loaded', () => {
    if (loadingWindow && !loadingWindow.isDestroyed())
      loadingWindow.close()
    win?.show()
    win?.focus()
  }) // ---------- 启动项 ----------
  const windowService = createWindowService(win)

  ipcMain.handle('auto-start', (_event, val) => {
    process.nextTick(() => {
      windowService.setAutoStart(val)
    })
    return Promise.resolve(true)
  })

  // ---------- 数据库操作 ----------
  ipcMain.handle('insert-upload-data', (_event, dataString) => {
    try {
      const data = JSON.parse(dataString)
      const isInserted = insertUploadData(data)
      return isInserted
    }
    catch (e) {
      logger.error(`[upload] Insert error: ${e}`)
      return false
    }
  })

  ipcMain.handle('fetch-all-upload-data', () => {
    try {
      const data = queryUploadData()
      return data
    }
    catch (e) {
      logger.error(`[upload] Query error: ${e}`)
    }
  })

  ipcMain.handle('delete-upload-data', (_event, key) => {
    try {
      deleteUploadData(key)
    }
    catch (e) {
      logger.error(`[upload] Delete error: ${e}`)
    }
  })

  ipcMain.handle('reset-settings', () => {
    logger.info('[settings] Reset and restarting')
  })

  // ---------- 开发者工具设置 ----------
  const shortcutService = createShortcutService(win)

  ipcMain.handle('reg-dev-tools', (_event, enabled) => {
    try {
      process.nextTick(() => {
        shortcutService.updateDevToolsShortcut(enabled)
      })
      return Promise.resolve(true)
    }
    catch (e) {
      logger.error(`[devTools] Error setting developer tools: ${e}`)
      return Promise.resolve(false)
    }
  })

  // ---------- 上传接口 ----------
  ipcMain.handle('upload', async (_event, { type, params }: { type: SupportedUploader, params: any }) => {
    try {
      const uploader = uploaders[type]
      if (!uploader?.upload) {
        logger.error(`[upload] Upload method not found for type: ${type}`)
        throw new Error(`Unsupported image host: ${type}`)
      }

      const result = await uploader.upload(params)
      logger.info(`[upload] ${type} upload successful`)
      return { success: true, data: result }
    }
    catch (e) {
      logger.error(`[upload] ${type} upload failed: ${e}`)
      return { success: false, message: (e as Error).message }
    }
  })

  // ---------- API 动态调用 ----------
  ipcMain.handle('api-call', async (_event, payload: { bed: SupportedUploader, method: string, args?: any[] }) => {
    const { bed, method, args = [] } = payload

    try {
      const bedModule = uploaders[bed]

      const apiModule = 'api' in bedModule ? (bedModule.api as Record<string, (...args: any[]) => any>) : null

      if (!apiModule || typeof apiModule[method] !== 'function') {
        logger.error(`[api-call] API method not found: ${bed}.api.${method}`)
        throw new Error(`API method does not exist: ${bed}.api.${method}`)
      }

      const result = await apiModule[method](...args)
      return { success: true, data: result }
    }
    catch (e) {
      logger.error(`[api-call] ${bed}.${method} call failed: ${e}`)
      return { success: false, message: (e as Error).message }
    }
  })
}
