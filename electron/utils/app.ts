import path from 'node:path'
import { platform } from '@electron-toolkit/utils'
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { Menu, Tray, app, dialog, globalShortcut, nativeImage } from 'electron'
import pkg from '../../package.json'
import logger from '../utils/logger'

export * from './cors'
export * from './ipc'

let tray = null

// 初始化系统
export function initSystem(win: BrowserWindow) {
  logger.info('[system] Initializing system...')
  createMenu(win)
  createSystemTray(win)

  win.on('focus', () => {
    regGlobalShortcut(win)
  })

  win.on('blur', () => {
    unGlobalShortcut()
  })

  logger.info('[system] System initialized.')
}

// 创建系统托盘
function createSystemTray(win: BrowserWindow) {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'favicon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('GioPic')
  tray.setContextMenu(createTrayMenu(win))
  logger.info('[tray] System tray created.')
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
      click: () => {
        logger.info('[tray] Open settings clicked.')
        openSetting(win)
      },
    },
    { type: 'separator' },
    {
      label: '重启应用',
      click: () => {
        logger.info('[tray] Restart application clicked.')
        app.relaunch()
        app.exit()
      },
    },
    { label: '退出', accelerator: 'CommandOrControl+Q', role: 'quit' },
  ])
}

// 注册全局快捷键
function regGlobalShortcut(win: BrowserWindow) {
  globalShortcut.register('CommandOrControl+,', () => {
    logger.info('[shortcut] Open settings shortcut triggered.')
    openSetting(win)
  })

  globalShortcut.register('CommandOrControl+U', () => {
    win?.webContents.send('upload-shortcut')
  })
}

// 注销全局快捷键
function unGlobalShortcut() {
  globalShortcut.unregisterAll()
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
  logger.info(`[autostart] Setting auto start to ${val}...`)
  if (!app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: val,
      path: process.execPath,
      args: val ? ['--hidden'] : [],
    })
  }
  else {
    app.setLoginItemSettings({
      openAtLogin: val,
      args: val ? ['--hidden'] : [],
    })
  }
  logger.info(`[autostart] Auto start set to ${val}.`)
}

// 创建菜单
function createMenu(win: BrowserWindow) {
  logger.info('[menu] Creating application menu...')
  if (platform.isMacOS) {
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
    logger.info('[menu] Application menu created for macOS.')
  }
  else {
    Menu.setApplicationMenu(null)
    logger.info('[menu] Application menu set to null for Windows/Linux.')
  }
}
