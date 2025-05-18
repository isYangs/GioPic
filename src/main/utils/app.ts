import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { platform } from '@electron-toolkit/utils'
import { app, Menu } from 'electron'
import logger from './logger'

export * from './store'

// 初始化系统
export function initSystem(win: BrowserWindow) {
  logger.info('[system] Initializing system...')
  createMenu(win)

  logger.info('[system] System initialized.')
}

// 打开设置
function openSetting(win: BrowserWindow, tab?: string) {
  win?.webContents.send('open-setting', tab)
  win?.show()
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
          { label: '关于', click: () => openSetting(win, 'about') },
          { label: '设置', accelerator: 'CommandOrControl+,', click: () => openSetting(win) },
          { label: '开发者工具', role: 'toggleDevTools' },
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
