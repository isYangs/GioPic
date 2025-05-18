import type { BrowserWindow } from 'electron'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { platform } from '@electron-toolkit/utils'
import { app, Menu, nativeImage, nativeTheme, Tray } from 'electron'
import logger from '../utils/logger'
import { checkForUpdates } from '../utils/update'

const ICON_LIGHT = 'trayTemplate.png'
const ICON_DARK = 'tray.png'

let tray: Tray | null = null

function createTrayService(win: BrowserWindow) {
  const initTrayIcon = () => {
    try {
      tray = new Tray(getTrayIcon())
      tray.setToolTip('GioPic')
      tray.setContextMenu(createTrayMenu(win))

      tray.on('double-click', () => {
        win?.show()
      })

      logger.info('[tray] System tray created.')
    }
    catch (error) {
      logger.error('[tray] Failed to create system tray:', error)
    }
  }

  initTrayIcon()

  // 监听系统主题变化，更新托盘图标
  nativeTheme.on('updated', () => {
    if (!tray)
      return
    tray.setImage(getTrayIcon())
  })

  app.on('before-quit', () => {
    if (tray) {
      tray.destroy()
      tray = null
      logger.info('[tray] System tray destroyed.')
    }
  })
}

// 检查 Windows 系统是否处于浅色模式
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
  let isLightMode = false

  if (platform.isWindows) {
    isLightMode = isWindowsLightMode()
  }

  const iconName = isLightMode ? ICON_LIGHT : ICON_DARK
  const iconPath = path.join(process.env.VITE_PUBLIC || '', iconName)

  try {
    return nativeImage.createFromPath(iconPath)
  }
  catch (error) {
    logger.error(`[tray] Failed to load tray icon from ${iconPath}:`, error)
    return nativeImage.createEmpty()
  }
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
        win?.webContents.send('open-setting')
        win?.show()
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

export default createTrayService
