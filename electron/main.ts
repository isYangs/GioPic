import path from 'node:path'
import { BrowserWindow, app, globalShortcut, nativeImage, session, shell } from 'electron'
import { init as initDB } from './db'
import { fixElectronCors, initSystem, setupIpcMain } from './utils/app'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 设置环境变量
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const NODE_ENV = process.env.NODE_ENV

// 创建窗口
function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 680,
    minWidth: 1050,
    minHeight: 680,
    frame: false,
    icon: nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'favicon.png')),
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
    shell.openExternal(url)
    return { action: 'deny' }
  })

  fixElectronCors(win)

  // 加载构建文件或开发服务器的 URL
  if (VITE_DEV_SERVER_URL)
    win.loadURL(VITE_DEV_SERVER_URL)
  else
    win.loadFile(path.join(process.env.DIST, 'index.html'))

  // 在开发模式下打开开发者工具
  if (NODE_ENV === 'development') {
    win.webContents.openDevTools()
    session.defaultSession.loadExtension(
      path.resolve(__dirname, '../extension/VueDevTools'),
    )
  }

  initDB()
  setupIpcMain(win)
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
  if (BrowserWindow.getAllWindows().length === 0)
    createWindow()
})

// 等待应用程序准备就绪后创建窗口
app.whenReady().then(() => {
  createWindow()
  if (win)
    initSystem(win)
})

// 当应用程序退出时
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
