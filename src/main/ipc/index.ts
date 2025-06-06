import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'
import { deleteUploadData, getUploadDataCount, insertUploadData, queryUploadData, queryUploadDataPaginated } from '../db/modules'
import createShortcutService from '../services/ShortcutService'
import createWindowService from '../services/WindowService'
import { generateThumbnail, getImageMetadata } from '../utils/image-processor'
import logger from '../utils/logger'
import { registerPluginIpc } from './plugin'

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
  })

  // ---------- 启动项 ----------
  const windowService = createWindowService(win)

  ipcMain.handle('auto-start', (_event, val) => {
    try {
      process.nextTick(() => {
        windowService.setAutoStart(val)
      })
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[autoStart] Error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '设置开机自启失败',
      }
    }
  })

  // ---------- 任务栏/Dock图标控制 ----------
  ipcMain.handle('dock-icon-show', (_event, visible: boolean) => {
    try {
      windowService.setDockIconVisible(visible)
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[dockIcon] Error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '设置任务栏图标失败',
      }
    }
  })

  // ---------- 插件相关 ----------
  registerPluginIpc()

  // ---------- 数据库操作 ----------
  ipcMain.handle('insert-upload-data', (_event, dataString) => {
    try {
      const data = JSON.parse(dataString)
      const isInserted = insertUploadData(data)
      return {
        success: isInserted,
        message: isInserted ? undefined : '插入上传数据失败',
      }
    }
    catch (e) {
      logger.error(`[upload] Insert error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '插入上传数据失败',
      }
    }
  })

  ipcMain.handle('fetch-upload-data-paginated', (_event, page = 1, pageSize = 20) => {
    try {
      const data = queryUploadDataPaginated(page, pageSize)
      const total = getUploadDataCount()
      return {
        success: true,
        data: {
          data,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      }
    }
    catch (e) {
      logger.error(`[upload] Paginated query error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取分页上传数据失败',
        data: { data: [], total: 0, page: 1, pageSize, totalPages: 0 },
      }
    }
  })

  ipcMain.handle('fetch-all-upload-data', () => {
    try {
      const data = queryUploadData()
      return {
        success: true,
        data,
      }
    }
    catch (e) {
      logger.error(`[upload] Query error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取所有上传数据失败',
        data: [],
      }
    }
  })

  ipcMain.handle('get-upload-data-count', () => {
    try {
      const count = getUploadDataCount()
      return {
        success: true,
        data: count,
      }
    }
    catch (e) {
      logger.error(`[upload] Count error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取上传数据数量失败',
        data: 0,
      }
    }
  })

  ipcMain.handle('get-upload-total-size', () => {
    try {
      const data = queryUploadData()
      const totalSize = data.reduce((sum, item) => sum + (item.size || 0), 0)
      return {
        success: true,
        data: totalSize,
      }
    }
    catch (e) {
      logger.error(`[upload] Total size error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取上传数据总大小失败',
        data: 0,
      }
    }
  })

  ipcMain.handle('delete-upload-data', (_event, key) => {
    try {
      deleteUploadData(key)
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[upload] Delete error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '删除上传数据失败',
      }
    }
  })

  ipcMain.handle('delete-upload-data-batch', (_event, keys: string[]) => {
    try {
      keys.forEach(key => deleteUploadData(key))
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[upload] Batch delete error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '批量删除上传数据失败',
      }
    }
  })

  ipcMain.handle('generate-image-thumbnail', async (_event, fileBuffer: ArrayBuffer, maxSize = 200) => {
    try {
      const result = await generateThumbnail(fileBuffer, maxSize)
      return {
        success: true,
        data: result,
      }
    }
    catch (e) {
      logger.error(`[thumbnail] Error generating thumbnail: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '生成缩略图失败',
      }
    }
  })

  ipcMain.handle('get-image-metadata', async (_event, fileBuffer: ArrayBuffer) => {
    try {
      const metadata = await getImageMetadata(fileBuffer)
      return {
        success: true,
        data: metadata,
      }
    }
    catch (e) {
      logger.error(`[metadata] Error getting image metadata: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取图片元数据失败',
      }
    }
  })

  ipcMain.handle('reset-settings', () => {
    try {
      logger.info('[settings] Reset and restarting')
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[settings] Reset error: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '重置设置失败',
      }
    }
  })

  // ---------- 开发者工具设置 ----------
  const shortcutService = createShortcutService(win)

  ipcMain.handle('reg-dev-tools', (_event, enabled) => {
    try {
      process.nextTick(() => {
        shortcutService.updateDevToolsShortcut(enabled)
      })
      return {
        success: true,
      }
    }
    catch (e) {
      logger.error(`[devTools] Error setting developer tools: ${e}`)
      return {
        success: false,
        message: e instanceof Error ? e.message : '设置开发者工具快捷键失败',
      }
    }
  })
}
