import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron'
import path from 'node:path'
import { fixElectronCors } from './cors'
import { setupIpcHandlers } from './ipcHandlers'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

// 设置环境变量
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const NODE_ENV = process.env.NODE_ENV

// 创建菜单
function createMenu() {
  // macOS 的设置
  if (process.platform === 'darwin') {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'GioPic',
        submenu: [
          { label: '关于', accelerator: 'CmdOrCtrl+I', role: 'about' },
          { type: 'separator' },
          { label: '隐藏', role: 'hide' },
          { label: '隐藏其他', role: 'hideOthers' },
          { type: 'separator' },
          { label: '服务', role: 'services' },
          { label: '退出', accelerator: 'Command+Q', role: 'quit' },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        ],
      },
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    // windows 和 linux 的设置
    Menu.setApplicationMenu(null)
  }
}
createMenu()

// 创建窗口
function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 800,
    minWidth: 1050,
    minHeight: 680,
    icon: path.join(process.env.VITE_PUBLIC, 'giopic-icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // 测试向渲染进程发送激活的推送消息
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  fixElectronCors(win)

  // 加载构建文件或开发服务器的 URL
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // 在开发模式下打开开发者工具
  if (NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

// 当所有窗口都关闭时退出，但在 macOS 上除外。在 macOS 上，应用程序及其菜单栏保持活动状态，直到用户使用 Cmd + Q 显式退出。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// 当应用程序被激活时
app.on('activate', () => {
  // 在 OS X 上，当dock图标被点击且没有其他窗口打开时，重新创建窗口是一种常见的做法。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 当接收到 quit-app 信号时
ipcMain.on('quit-app', () => {
  app.quit()
  win = null
})

setupIpcHandlers()

// 等待应用程序准备就绪后创建窗口
app.whenReady().then(createWindow)
