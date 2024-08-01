import type { BrowserWindow } from 'electron'
import { app, globalShortcut, ipcMain } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from '../db/modules'
import { autoStart } from './app'

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

  ipcMain.handle('check-shortcut', (_event, key: string) => {
    const isRegistered = globalShortcut.isRegistered(key)
    return isRegistered
  })

  ipcMain.handle('create-uploadData', (_event, dataString) => {
    const data = JSON.parse(dataString)
    insertUploadData(data)
  })

  ipcMain.handle('get-uploadData', () => {
    const data = queryUploadData()
    return data
  })

  ipcMain.handle('del-uploadData', (_event, key) => {
    deleteUploadData(key)
  })
}
