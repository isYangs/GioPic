import { app, globalShortcut, ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from '../db/modules'
import { autoStart, createAboutWindow } from './app'
import logger from './logger'

export function setupIpcMain(win: BrowserWindow) {
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

  ipcMain.handle('auto-start', (_event, val) => {
    autoStart(val)
  })

  ipcMain.handle('insert-upload-data', (_event, dataString) => {
    try {
      const data = JSON.parse(dataString)
      insertUploadData(data)
      logger.info('[upload] Successfully inserted upload data into the database.')
    }
    catch (e) {
      logger.error(`[upload] Error inserting upload data into the database: ${e}`)
    }
  })

  ipcMain.handle('fetch-all-upload-data', () => {
    try {
      const data = queryUploadData()
      logger.info('[upload] Successfully retrieved all upload data from the database.')
      return data
    }
    catch (e) {
      logger.error(`[upload] Error retrieving upload data from the database: ${e}`)
    }
  })

  ipcMain.handle('delete-upload-data', (_event, key) => {
    try {
      deleteUploadData(key)
      logger.info('[upload] Successfully deleted upload data from the database.')
    }
    catch (e) {
      logger.error(`[upload] Error deleting upload data from the database: ${e}`)
    }
  })

  ipcMain.handle('devtools', (_event, val) => {
    if (val) {
      globalShortcut.register('CommandOrControl+Shift+I', () => {
        win?.webContents.openDevTools({ mode: ('detach') })
      })
    }
    else {
      globalShortcut.unregister('CommandOrControl+Shift+I')
    }
  })

  ipcMain.handle('app-version', () => {
    return app.getVersion()
  })
}
