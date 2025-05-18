import type { BrowserWindow } from 'electron'
import { app, globalShortcut, Menu, MenuItem } from 'electron'
import logger from '../utils/logger'
import { getStore } from '../utils/store'

interface ShortcutConfig {
  key: string
  description: string
  global?: boolean
  handler: () => void
}

export interface IShortcutService {
  init: () => void
  destroy: () => void
  updateDevToolsShortcut: (isEnabled: boolean) => void
}

export class ShortcutService implements IShortcutService {
  private static readonly DEV_TOOLS_SHORTCUT_KEY = 'CommandOrControl+Shift+D'
  private registeredShortcuts: string[] = []
  private readonly mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.init()
    this.registerEvents()
  }

  public init(): void {
    this.registerAppShortcuts()

    const isDevToolsEnabled = getStore('isDevToolsEnabled')
    if (isDevToolsEnabled !== undefined) {
      this.updateDevToolsShortcut(!!isDevToolsEnabled)
    }
  }

  /**
   * 注册事件监听器
   * @private
   */
  private registerEvents(): void {
    app.on('will-quit', () => this.destroy())

    app.on('browser-window-blur', () => {
      this.unregisterGlobalShortcuts()
    })

    app.on('browser-window-focus', () => {
      this.registerAppShortcuts()

      const isDevToolsEnabled = getStore('isDevToolsEnabled')
      if (isDevToolsEnabled === true) {
        this.updateDevToolsShortcut(true)
      }
    })
  }

  /**
   * 更新开发者工具快捷键状态
   * @param isEnabled 是否启用开发者工具快捷键
   */
  public updateDevToolsShortcut(isEnabled: boolean): void {
    setImmediate(() => {
      this.unregisterDevToolsShortcut()

      if (isEnabled) {
        const devToolsShortcut: ShortcutConfig = {
          key: ShortcutService.DEV_TOOLS_SHORTCUT_KEY,
          description: '打开开发者工具',
          global: true,
          handler: () => {
            this.mainWindow.webContents.openDevTools({ mode: 'detach' })
          },
        }
        this.registerGlobalShortcut(devToolsShortcut.key, devToolsShortcut.handler)
      }
    })
  }

  /**
   * 销毁快捷键服务，取消注册所有全局快捷键
   */
  public destroy(): void {
    this.unregisterGlobalShortcuts()
  }

  /**
   * 注册应用内快捷键
   * @private
   */
  private registerAppShortcuts(): void {
    const shortcuts: ShortcutConfig[] = [
      {
        key: 'CommandOrControl+,',
        description: '打开设置',
        handler: () => {
          this.mainWindow.webContents.send('open-setting')
          this.mainWindow.show()
        },
      },
    ]

    shortcuts.forEach((shortcut) => {
      if (shortcut.global) {
        this.registerGlobalShortcut(shortcut.key, shortcut.handler)
      }
      else {
        this.registerLocalShortcut(shortcut.key, shortcut.handler)
      }
    })
  }

  /**
   * 注册全局快捷键
   * @param key 快捷键
   * @param handler 处理函数
   * @private
   */
  private registerGlobalShortcut(key: string, handler: () => void): void {
    try {
      const registered = globalShortcut.register(key, handler)

      if (registered) {
        this.registeredShortcuts.push(key)
      }
    }
    catch (error) {
      logger.error(`[shortcut] Error registering global shortcut ${key}:`, error)
    }
  }

  /**
   * 注册应用内快捷键（通过菜单加速键）
   * @param key 快捷键
   * @param handler 处理函数
   * @private
   */
  private registerLocalShortcut(key: string, handler: () => void): void {
    const template = Menu.getApplicationMenu() || Menu.buildFromTemplate([])
    template.append(new MenuItem({
      label: 'Hidden',
      visible: false,
      accelerator: key,
      click: handler,
    }))

    Menu.setApplicationMenu(template)
  }

  /**
   * 注销所有全局快捷键
   * @private
   */
  private unregisterGlobalShortcuts(): void {
    globalShortcut.unregisterAll()
    this.registeredShortcuts.length = 0
  }

  /**
   * 注销开发者工具快捷键
   * @private
   */
  private unregisterDevToolsShortcut(): void {
    if (this.registeredShortcuts.includes(ShortcutService.DEV_TOOLS_SHORTCUT_KEY)) {
      try {
        globalShortcut.unregister(ShortcutService.DEV_TOOLS_SHORTCUT_KEY)
        const index = this.registeredShortcuts.indexOf(ShortcutService.DEV_TOOLS_SHORTCUT_KEY)
        if (index > -1) {
          this.registeredShortcuts.splice(index, 1)
        }
      }
      catch (error) {
        logger.error(`[shortcut] Error unregistering DevTools shortcut: ${error}`)
      }
    }
  }
}

export default function createShortcutService(win: BrowserWindow): IShortcutService {
  return new ShortcutService(win)
}
