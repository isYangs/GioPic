import type { BrowserWindow } from 'electron'
import { app, globalShortcut, Menu, MenuItem } from 'electron'
import logger from '../utils/logger'

interface ShortcutConfig {
  key: string
  description: string
  global?: boolean
  handler: () => void
}

const registeredShortcuts: string[] = []

function createShortcutService(mainWindow: BrowserWindow) {
  registerAppShortcuts(mainWindow)

  app.on('will-quit', unregisterGlobalShortcuts)

  // 当应用失去焦点时，可以选择禁用全局快捷键
  app.on('browser-window-blur', () => {
    unregisterGlobalShortcuts()
  })

  // 当应用获得焦点时，重新注册全局快捷键
  app.on('browser-window-focus', () => {
    registerAppShortcuts(mainWindow)
  })

  logger.info('[shortcut] Shortcut service initialized')
}

function registerAppShortcuts(mainWindow: BrowserWindow) {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'CommandOrControl+,',
      description: '打开设置',
      handler: () => {
        logger.info('[shortcut] Settings shortcut triggered')
        mainWindow.webContents.send('open-setting')
        mainWindow.show()
      },
    },
  ]

  shortcuts.forEach((shortcut) => {
    if (shortcut.global) {
      registerGlobalShortcut(shortcut.key, shortcut.handler)
    }
    else {
      registerLocalShortcut(shortcut.key, shortcut.handler)
    }
  })
}

function registerGlobalShortcut(key: string, handler: () => void) {
  try {
    const registered = globalShortcut.register(key, handler)

    if (registered) {
      registeredShortcuts.push(key)
      logger.info(`[shortcut] Global shortcut registered: ${key}`)
    }
    else {
      logger.error(`[shortcut] Failed to register global shortcut: ${key}`)
    }
  }
  catch (error) {
    logger.error(`[shortcut] Error registering global shortcut ${key}:`, error)
  }
}

// 注册应用内快捷键（通过菜单加速键）
function registerLocalShortcut(key: string, handler: () => void) {
  const template = Menu.getApplicationMenu() || Menu.buildFromTemplate([])
  template.append(new MenuItem({
    label: 'Hidden',
    visible: false,
    accelerator: key,
    click: handler,
  }))

  Menu.setApplicationMenu(template)
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll()
  registeredShortcuts.length = 0
}

// function sendShortcutToRenderer(mainWindow: BrowserWindow, channel: string, data?: any) {
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     mainWindow.webContents.send(channel, data)
//   }
// }

export default createShortcutService
