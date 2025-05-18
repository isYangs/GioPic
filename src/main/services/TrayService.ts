import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { platform } from '@electron-toolkit/utils'
import { app, Menu, nativeImage, nativeTheme, Tray } from 'electron'
import logger from '../utils/logger'
import { AppUpdater } from './AppUpdater'

export interface ITrayService {
  init: () => void
  destroy: () => void
  updateIcon: () => void
}

export class TrayService implements ITrayService {
  private static readonly ICON_LIGHT = 'trayTemplate.png'
  private static readonly ICON_DARK = 'tray.png'

  private tray: Tray | null = null
  private readonly mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.init()
    this.registerEvents()
  }

  public init(): void {
    try {
      this.tray = new Tray(this.getTrayIcon())
      this.tray.setToolTip('GioPic')
      this.tray.setContextMenu(this.createTrayMenu())

      this.tray.on('double-click', () => {
        this.mainWindow?.show()
      })
    }
    catch (error) {
      logger.error('[tray] Failed to create system tray:', error)
    }
  }

  /**
   * 注册事件监听器
   * @private
   */
  private registerEvents(): void {
    nativeTheme.on('updated', () => {
      this.updateIcon()
    })

    app.on('before-quit', () => {
      this.destroy()
    })
  }

  /** 更新托盘图标 */
  public updateIcon(): void {
    if (!this.tray)
      return
    this.tray.setImage(this.getTrayIcon())
  }

  /** 销毁托盘 */
  public destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }

  /**
   * 检查 Windows 系统是否处于浅色模式
   * @private
   * @returns {boolean} 是否为浅色模式
   */
  private isWindowsLightMode(): boolean {
    try {
      const stdout = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v SystemUsesLightTheme')
      return stdout.toString().includes('0x1')
    }
    catch (error) {
      logger.error('[tray] Error fetching Windows mode:', error)
      return false
    }
  }

  /**
   * 根据系统模式获取托盘图标
   * @private
   * @returns {Electron.NativeImage} 托盘图标
   */
  private getTrayIcon(): Electron.NativeImage {
    let isLightMode = false

    if (platform.isWindows) {
      isLightMode = this.isWindowsLightMode()
    }

    const iconName = isLightMode ? TrayService.ICON_LIGHT : TrayService.ICON_DARK
    const iconPath = path.join(process.env.VITE_PUBLIC || '', iconName)

    try {
      return nativeImage.createFromPath(iconPath)
    }
    catch (error) {
      logger.error(`[tray] Failed to load tray icon from ${iconPath}:`, error)
      return nativeImage.createEmpty()
    }
  }

  /**
   * 创建系统托盘菜单
   * @private
   * @returns {Electron.Menu} 托盘菜单
   */
  private createTrayMenu(): Electron.Menu {
    const menuTemplate: MenuItemConstructorOptions[] = [
      {
        label: '显示主窗口',
        click: (): void => {
          this.mainWindow?.show()
        },
      },
      { type: 'separator' },
      {
        label: '设置',
        accelerator: 'CommandOrControl+,',
        click: (): void => {
          this.mainWindow?.webContents.send('open-setting')
          this.mainWindow?.show()
        },
      },
      { type: 'separator' },
      {
        label: '检查更新',
        click: (): void => {
          const appUpdater = new AppUpdater(this.mainWindow)
          appUpdater.checkForUpdates()
        },
      },
      {
        label: '重启应用',
        click: (): void => {
          app.relaunch()
          app.exit()
        },
      },
      { label: '退出', accelerator: 'CommandOrControl+Q', role: 'quit' },
    ]

    return Menu.buildFromTemplate(menuTemplate)
  }
}

/**
 * 创建托盘服务的工厂函数 (提供与原始 API 兼容的方式)
 * @param win 主窗口实例
 * @returns {TrayService} 托盘服务实例
 */

export default function createTrayService(win: BrowserWindow): TrayService {
  return new TrayService(win)
}
