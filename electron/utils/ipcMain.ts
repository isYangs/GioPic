import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from '../db/modules'
import { autoStart } from './app'

export function setupIpcMain(win: BrowserWindow) {
  ipcMain.on('window-min', () => {
    win.minimize()
  })

  ipcMain.on('window-maxOrRestore', (event) => {
    if (win.isMaximized())
      win.unmaximize()
    else
      win.maximize()

    event.reply('window-maxOrRestore-reply', win?.isMaximized())
  })

  ipcMain.on('window-hide', () => {
    win.hide()
  })

  ipcMain.on('window-close', () => {
    app.quit()
    win.close()
  })

  ipcMain.on('auto-start', (_event, val) => {
    autoStart(val)
  })

  ipcMain.on('create-uploadData', (_event, dataString) => {
    const data = JSON.parse(dataString)
    insertUploadData(data)
  })

  ipcMain.on('get-uploadData', (event) => {
    const data = queryUploadData()
    event.reply('get-uploadData-status', data)
  })

  ipcMain.on('delete-uploadData', (_event, key) => {
    deleteUploadData(key)
  })
}
