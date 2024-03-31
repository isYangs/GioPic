import type { BrowserWindow } from 'electron'
import { app, dialog, ipcMain } from 'electron'

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

  ipcMain.on('open-directory-dialog', (event, p) => {
    dialog
      .showOpenDialog({
        properties: [p],
        title: '请选择上传日志保存目录',
        buttonLabel: '选择',
      })
      .then((result) => {
        event.reply('selectedPath', result.filePaths[0])
      })
  })

  // 根据当前用户的操作系统，设置记录文件的默认保存路径
  ipcMain.on('get-default-ur-file-path', (event) => {
    const defaultPath = app.getPath('documents')
    event.reply('get-default-ur-file-path-reply', defaultPath)
  })
}
