import path from 'node:path'
import fs from 'node:fs'
import type { BrowserWindow } from 'electron'
import { app, dialog, ipcMain } from 'electron'
import DataBase from '../../db'

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
  /**
   * Electron 主进程中的事件处理函数，用于处理 'open-directory-dialog' 事件。
   *
   * 当收到 'open-directory-dialog' 事件时，此函数会打开一个目录选择对话框，让用户选择一个目录。
   * 选择的目录路径会通过 'selectedPath' 事件发送回渲染进程。
   *
   * @param {Electron.IpcMainEvent} event - Electron IPC 主事件。
   * @param {string} p - 对话框的属性。例如，'openDirectory' 表示对话框将允许用户选择目录。
   */
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

  /**
   * Electron 主进程中的事件处理函数，用于处理 'create-ur-file' 事件。
   *
   * 当收到 'create-ur-file' 事件时，此函数会将上传记录保存到指定的文件中。
   * 如果文件已经存在，它会读取文件中的现有数据，然后将新的上传记录添加到数据中。
   * 如果文件不存在，它会创建一个新的文件，并将上传日志保存到文件中。
   *
   * @param {Electron.IpcMainEvent} event - Electron IPC 主事件。
   * @param {string} uploadRecord - 上传记录的 JSON 字符串。上传记录是一个包含上传信息的对象，它被序列化为 JSON 字符串。
   * @param {string} savePath - 保存路径。这是一个文件系统路径，指定了上传记录应该保存的位置。
   */
  ipcMain.on('create-ur-file', async (event, uploadRecord: string, savePath: string) => {
    const dirPath = path.join(savePath, 'GioPic')
    const filePath = path.join(dirPath, 'GioPic-UR.json')

    // 检查目录是否存在，如果不存在则创建它
    if (!fs.existsSync(dirPath))
      fs.mkdirSync(dirPath, { recursive: true })

    const db = new DataBase(filePath)

    try {
      const uploadRecordObject = JSON.parse(uploadRecord)

      const data = db.read()
      if (!data) {
        db.write([uploadRecordObject])
      }
      else {
        db.update((data) => {
          // 检查新的记录项是否已经存在，如果存在就不添加
          if (data.some((item: object) => JSON.stringify(item) === uploadRecord)) {
            return data
          }
          else {
            const newData = [...data, uploadRecordObject]
            return newData
          }
        })
      }

      event.reply('create-ur-file-status', true)
    }
    catch (error) {
      event.reply('create-ur-file-status', false)
    }
  })

  ipcMain.on('get-ur-file', async (event, savePath: string) => {
    if (!savePath) {
      event.reply('get-ur-file-status', false)
      return
    }

    savePath = path.join(savePath, 'GioPic', 'GioPic-UR.json')

    const db = new DataBase(savePath)
    const initialData = db.read()
    event.reply('get-ur-file-status', true, initialData)

    // 监听文件改变
    fs.watch(savePath, (eventType) => {
      if (eventType === 'change') {
        // 当文件改变时，重新读取文件
        const data = db.read()
        // 发送文件改变的事件
        event.reply('get-ur-file-status', true, data)
      }
    })
  })

  ipcMain.on('delete-ur-file', async (event, savePath: string, id: string) => {
    if (!savePath) {
      event.reply('delete-ur-file-status', false)
      return
    }

    savePath = path.join(savePath, 'GioPic', 'GioPic-UR.json')

    const db = new DataBase(savePath)
    const data = db.read()

    const newData = data.filter((item: any) => item.id !== id)

    db.write(newData)

    event.reply('delete-ur-file-status', true)
  })

  // 根据当前用户的操作系统，设置记录文件的默认保存路径
  ipcMain.on('get-default-ur-file-path', (event) => {
    const defaultPath = app.getPath('documents')
    event.reply('get-default-ur-file-path-reply', defaultPath)
  })
}
