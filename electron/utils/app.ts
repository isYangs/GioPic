import path from 'node:path'
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { Menu, Tray, app, dialog, globalShortcut, nativeImage } from 'electron'
import pkg from '../../package.json'

export * from './cors'
export * from './ipcMain'

let tray = null
// const isMac = process.platform === 'darwin'

// 初始化系统
export function initSystem(win: BrowserWindow) {
  createMenu(win)
  createSystemTray(win)
  registerGlobalShortcut(win)
}

// 创建系统托盘
function createSystemTray(win: BrowserWindow) {
  tray = new Tray(nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'favicon.png')).resize({ width: 16, height: 16 }))

  tray.setToolTip('GioPic')
  tray.setContextMenu(createTrayMenu(win))

  // 打开主窗口
  // tray.on('click', () => win?.show())
}

// 创建系统托盘菜单
function createTrayMenu(win: BrowserWindow) {
  return Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        win?.show()
      },
    },
    { type: 'separator' },
    {
      label: '设置',
      accelerator: 'CommandOrControl+,',
      click: () => openSetting(win),
    },
    { type: 'separator' },
    {
      label: '重启应用',
      click: () => {
        app.relaunch()
        app.exit()
      },
    },
    { label: '退出', accelerator: 'CommandOrControl+Q', role: 'quit' },
  ])
}

// 注册全局快捷键
function registerGlobalShortcut(win: BrowserWindow) {
  globalShortcut.register('CommandOrControl+,', () => {
    openSetting(win)
  })
}

// 打开设置
function openSetting(win: BrowserWindow) {
  win?.webContents.send('open-setting')
  win?.show()
}

// 打开关于窗口
function openAbout() {
  dialog.showMessageBox({
    title: 'PicGo',
    message: 'PicGo',
    detail: `Version: ${pkg.version}\nAuthor: isYangs\nGithub: github.com/isYangs/GioPic`,
  })
}

// 开机自启
export function autoStart(val: boolean) {
  if (!app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: val,
      path: process.execPath,
    })
  }
  else {
    app.setLoginItemSettings({
      openAtLogin: val,
    })
  }
}

// 创建菜单
function createMenu(win: BrowserWindow) {
  // macOS 的设置
  if (process.platform === 'darwin') {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'GioPic',
        submenu: [
          { label: '关于', accelerator: 'Command+I', click: openAbout },
          { label: '设置', accelerator: 'CommandOrControl+,', click: () => openSetting(win) },
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
        ],
      },
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
  else {
    // windows 和 linux 的设置
    Menu.setApplicationMenu(null)
  }
}
