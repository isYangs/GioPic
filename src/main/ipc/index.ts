import type { BrowserWindow } from 'electron'
import { app, dialog, ipcMain } from 'electron'
import { deleteUploadData, getUploadDataCount, insertUploadData, queryUploadData, queryUploadDataPaginated } from '../db/modules'
import createShortcutService from '../services/ShortcutService'
import createWindowService from '../services/WindowService'
import { generateThumbnail, getImageMetadata } from '../utils/image-processor'
import logger from '../utils/logger'
import { registerPluginIpc } from './plugin'

interface PaginatedParams {
  page?: number
  pageSize?: number
}

interface ThumbnailParams {
  fileBuffer: ArrayBuffer
  maxSize?: number
}

export function registerIpc(win: BrowserWindow, loadingWindow: BrowserWindow | null) {
  // ---------- 窗口操作 ----------
  ipcMain.handle('window-min', () => {
    win.minimize()
  })

  ipcMain.handle('window-maxOrRestore', () => {
    if (win.isMaximized())
      win.unmaximize()
    else
      win.maximize()
    return win.isMaximized()
  })

  ipcMain.handle('window-hide', () => {
    win.hide()
  })

  ipcMain.handle('window-close', () => {
    app.quit()
    win.close()
  })

  ipcMain.handle('window-show', () => {
    win.show()
  })

  ipcMain.handle('app-version', () => {
    return app.getVersion()
  })

  ipcMain.on('win-loaded', () => {
    if (loadingWindow && !loadingWindow.isDestroyed())
      loadingWindow.close()
    win?.show()
    win?.focus()
  })

  // ---------- 启动项 ----------
  const windowService = createWindowService(win)

  ipcMain.handle('auto-start', (_event, val: boolean) => {
    try {
      process.nextTick(() => {
        windowService.setAutoStart(val)
      })
    }
    catch (e) {
      logger.error(`[autoStart] Error: ${e}`)
      throw new Error('设置开机自启失败')
    }
  })

  // ---------- 任务栏/Dock图标控制 ----------
  ipcMain.handle('dock-icon-show', (_event, visible: boolean) => {
    try {
      windowService.setDockIconVisible(visible)
    }
    catch (e) {
      logger.error(`[dockIcon] Error: ${e}`)
      throw new Error('设置任务栏图标失败')
    }
  })

  // ---------- 插件相关 ----------
  registerPluginIpc()

  // ---------- 数据库操作 ----------
  ipcMain.handle('insert-upload-data', (_event, dataString: string) => {
    try {
      const data = JSON.parse(dataString)
      const isInserted = insertUploadData(data)
      if (!isInserted) {
        throw new Error('插入上传数据失败')
      }
    }
    catch (e) {
      logger.error(`[upload] Insert error: ${e}`)
      throw new Error('插入上传数据失败')
    }
  })

  ipcMain.handle('fetch-upload-data-paginated', (_event, params: PaginatedParams = {}) => {
    try {
      const { page = 1, pageSize = 20 } = params
      const data = queryUploadDataPaginated(page, pageSize)
      const total = getUploadDataCount()
      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }
    catch (e) {
      logger.error(`[upload] Paginated query error: ${e}`)
      throw new Error('获取分页上传数据失败')
    }
  })

  ipcMain.handle('fetch-all-upload-data', () => {
    try {
      const data = queryUploadData()
      return data
    }
    catch (e) {
      logger.error(`[upload] Query error: ${e}`)
      throw new Error('获取所有上传数据失败')
    }
  })

  ipcMain.handle('get-upload-data-count', () => {
    try {
      const count = getUploadDataCount()
      return count
    }
    catch (e) {
      logger.error(`[upload] Count error: ${e}`)
      throw new Error('获取上传数据数量失败')
    }
  })

  ipcMain.handle('get-upload-total-size', () => {
    try {
      const data = queryUploadData()
      const totalSize = data.reduce((sum, item) => sum + (item.size || 0), 0)
      return totalSize
    }
    catch (e) {
      logger.error(`[upload] Total size error: ${e}`)
      throw new Error('获取上传数据总大小失败')
    }
  })

  ipcMain.handle('delete-upload-data', (_event, key: string) => {
    try {
      deleteUploadData(key)
    }
    catch (e) {
      logger.error(`[upload] Delete error: ${e}`)
      throw new Error('删除上传数据失败')
    }
  })

  ipcMain.handle('delete-upload-data-batch', (_event, keys: string[]) => {
    try {
      keys.forEach(key => deleteUploadData(key))
    }
    catch (e) {
      logger.error(`[upload] Batch delete error: ${e}`)
      throw new Error('批量删除上传数据失败')
    }
  })

  ipcMain.handle('generate-image-thumbnail', async (_event, params: ThumbnailParams) => {
    try {
      const { fileBuffer, maxSize = 200 } = params
      const result = await generateThumbnail(fileBuffer, maxSize)
      return result
    }
    catch (e) {
      logger.error(`[thumbnail] Error generating thumbnail: ${e}`)
      throw new Error('生成缩略图失败')
    }
  })

  ipcMain.handle('get-image-metadata', async (_event, fileBuffer: ArrayBuffer) => {
    try {
      const metadata = await getImageMetadata(fileBuffer)
      return metadata
    }
    catch (e) {
      logger.error(`[metadata] Error getting image metadata: ${e}`)
      throw new Error('获取图片元数据失败')
    }
  })

  // ---------- 存储配置导入/导出 ----------
  ipcMain.handle('import-program-config', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '导入存储配置',
        properties: ['openFile'],
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      })

      if (canceled || filePaths.length === 0) {
        return null
      }

      const fs = await import('node:fs')
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      return JSON.parse(content)
    }
    catch (e) {
      logger.error(`[program] Import config error: ${e}`)
      throw new Error('导入配置失败')
    }
  })

  ipcMain.handle('export-program-config', async (_event, params: { name: string, data: any }) => {
    try {
      const { name, data } = params
      const safeName = (name || 'untitled').replace(/[^\w\u4E00-\u9FA5-]/g, '_').substring(0, 50)
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出存储配置',
        defaultPath: `giopic-config-${safeName}.json`,
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      })

      if (canceled || !filePath) {
        return null
      }

      const fs = await import('node:fs')
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return filePath
    }
    catch (e) {
      logger.error(`[program] Export config error: ${e}`)
      throw new Error('导出配置失败')
    }
  })

  ipcMain.handle('reset-settings', () => {
    try {
      logger.info('[settings] Reset and restarting')
    }
    catch (e) {
      logger.error(`[settings] Reset error: ${e}`)
      throw new Error('重置设置失败')
    }
  })

  // ---------- 开发者工具设置 ----------
  const shortcutService = createShortcutService(win)

  ipcMain.handle('reg-dev-tools', (_event, enabled: boolean) => {
    try {
      process.nextTick(() => {
        shortcutService.updateDevToolsShortcut(enabled)
      })
    }
    catch (e) {
      logger.error(`[devTools] Error setting developer tools: ${e}`)
      throw new Error('设置开发者工具快捷键失败')
    }
  })
}
