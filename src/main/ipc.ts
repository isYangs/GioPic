import type { BrowserWindow } from 'electron'
import type { SupportedUploader } from './services/beds'
import { app, ipcMain } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from './db/modules'
import { uploaders } from './services/beds'
import { autoStart } from './utils/app'
import logger from './utils/logger'

export function registerIpc(win: BrowserWindow) {
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

  // ---------- 启动项 ----------
  ipcMain.handle('auto-start', (_event, val) => {
    autoStart(val)
  })

  // ---------- 数据库操作 ----------
  ipcMain.handle('insert-upload-data', (_event, dataString) => {
    try {
      const data = JSON.parse(dataString)
      const isInserted = insertUploadData(data)
      if (!isInserted) {
        logger.info(`[upload] Record with key '${data.key}' already exists, skipped insertion`)
      }
      else {
        logger.info(`[upload] Successfully inserted record with key '${data.key}'`)
      }
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
      logger.info('[upload] Query success')
      return data
    }
    catch (e) {
      logger.error(`[upload] Query error: ${e}`)
    }
  })

  ipcMain.handle('delete-upload-data', (_event, key) => {
    try {
      deleteUploadData(key)
      logger.info('[upload] Delete success')
    }
    catch (e) {
      logger.error(`[upload] Delete error: ${e}`)
    }
  })

  ipcMain.handle('reset-settings', () => {
    logger.info('[settings] Reset and restarting')
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
      logger.info(`[upload] ${type} upload successful: ${JSON.stringify(result)}`)
      return { success: true, data: result }
    }
    catch (err) {
      logger.error(`[upload] ${type} upload failed: ${err}`)
      return { success: false, message: (err as Error).message }
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
