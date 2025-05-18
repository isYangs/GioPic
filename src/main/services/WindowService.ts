import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { platform } from '@electron-toolkit/utils'
import { app, Menu } from 'electron'
import logger from '../utils/logger'

export interface IWindowService {
  init: () => void
  setAutoStart: (val: boolean) => void
  openSetting: (tab?: string) => void
}

export class WindowService implements IWindowService {
  private readonly win: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.win = mainWindow
    this.init()
  }

  public init(): void {
    this.createApplicationMenu()
  }

  /**
   * 打开设置面板
   * @param tab 可选的设置面板选项卡
   */
  public openSetting(tab?: string): void {
    this.win?.webContents.send('open-setting', tab)
    this.win?.show()
  }

  /**
   * 设置应用程序自动启动
   * @param val 是否启用自动启动
   */
  public setAutoStart(val: boolean): void {
    // 使用 setImmediate 进行异步处理，不阻塞主线程
    setImmediate(() => {
      const options = {
        openAtLogin: val,
        args: val ? ['--hidden'] : [],
      }

      if (!app.isPackaged) {
        app.setLoginItemSettings({
          ...options,
          path: process.execPath,
        })
      }
      else {
        app.setLoginItemSettings(options)
      }

      logger.info(`[autostart] Auto start set to ${val}.`)
    })
  }

  /**
   * 创建应用菜单
   * @private
   */
  private createApplicationMenu(): void {
    if (platform.isMacOS) {
      const template: MenuItemConstructorOptions[] = [
        {
          label: 'GioPic',
          submenu: [
            { label: '关于', click: () => this.openSetting('about') },
            { label: '设置', accelerator: 'CommandOrControl+,', click: () => this.openSetting() },
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
      Menu.setApplicationMenu(null)
    }
  }
}

export default function createWindowService(mainWindow: BrowserWindow): IWindowService {
  return new WindowService(mainWindow)
}
