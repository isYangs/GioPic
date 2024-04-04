import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'
import { deleteUploadData, insertUploadData, queryUploadData } from '../db/modules'

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

  ipcMain.on('create-uploadData', (event, dataString) => {
    try {
      const data = JSON.parse(dataString)
      insertUploadData(data)
      event.reply('create-uploadData-status', true)
    }
    catch (error) {
      event.reply('create-uploadData-status', false)
    }
  })

  ipcMain.on('get-uploadData', (event) => {
    const data = queryUploadData()
    event.reply('get-uploadData-status', data)
  })

  ipcMain.on('delete-uploadData', (event, key) => {
    deleteUploadData(key)
    event.reply('delete-uploadData-status', true)
  })
}
