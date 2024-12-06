import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { platform } from '@electron-toolkit/utils'
import { app, globalShortcut, Menu, nativeImage, nativeTheme, Tray } from 'electron'
import logger from './logger'
import { getStore } from './store'
import { checkForUpdates } from './update'

export * from './cors'
export * from './ipc'
export * from './store'

let tray: Tray | null = null

// 初始化系统
export function initSystem(win: BrowserWindow) {
  logger.info('[system] Initializing system...')
  createMenu(win)
  createSystemTray(win)

  win.on('focus', () => {
    regDevToolsShortcut(win, getStore('isDevToolsEnabled'))
    regGlobalShortcut(win)
  })
  win.on('blur', unGlobalShortcut)

  nativeTheme.on('updated', () => {
    if (!tray)
      return
    tray.setImage(getTrayIcon())
  })

  logger.info('[system] System initialized.')
}

// 创建系统托盘
function createSystemTray(win: BrowserWindow) {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('GioPic')
  tray.setContextMenu(createTrayMenu(win))

  tray.on('double-click', () => {
    win?.show()
  })

  logger.info('[tray] System tray created.')
}

function isWindowsLightMode() {
  try {
    const stdout = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v SystemUsesLightTheme')
    return stdout.toString().includes('0x1')
  }
  catch (error) {
    logger.error('Error fetching Windows mode:', error)
    return false
  }
}

// 根据系统模式获取托盘图标
function getTrayIcon() {
  const isLightMode = platform.isWindows && isWindowsLightMode()
  const iconName = isLightMode ? 'trayTemplate.png' : 'tray.png'
  const iconPath = path.join(process.env.VITE_PUBLIC, iconName)
  return nativeImage.createFromPath(iconPath)
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
      label: '检查更新',
      click: () => {
        logger.info('[tray] Check for updates clicked.')
        checkForUpdates()
      },
    },
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

// 注册开发者工具快捷键
export function regDevToolsShortcut(win: BrowserWindow, val: boolean) {
  if (val) {
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      win?.webContents.openDevTools({ mode: ('detach') })
    })
  }
  else {
    globalShortcut.unregister('CommandOrControl+Shift+D')
  }
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
// function openAbout(win: BrowserWindow) {
//   win?.webContents.send('open-about')
//   win?.show()
// }

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
          // { label: '关于', accelerator: 'Command+I', click: () => openAbout(win) },
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
