import { vi } from 'vitest'

export const app = {
  getPath: vi.fn((key: string) => (key === 'userData' ? '/tmp' : '/tmp')),
  getVersion: vi.fn(() => '0.0.1'),
  isPackaged: false,
  whenReady: vi.fn(async () => {}),
  on: vi.fn(),
  quit: vi.fn(),
}

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
}

export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

export const globalShortcut = {
  register: vi.fn(() => true),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
}

export const Menu = {
  getApplicationMenu: vi.fn(() => null),
  setApplicationMenu: vi.fn(),
  buildFromTemplate: vi.fn(() => ({
    append: vi.fn(),
  })),
}

export const MenuItem = vi.fn(function MenuItem(this: any, options: Record<string, unknown>) {
  Object.assign(this, options)
})

export const Tray = vi.fn(function Tray(this: any) {
  this.setToolTip = vi.fn()
  this.setContextMenu = vi.fn()
  this.setImage = vi.fn()
  this.destroy = vi.fn()
  this.on = vi.fn()
})

export const nativeImage = {
  createFromPath: vi.fn(() => ({
    resize: vi.fn(() => ({})),
  })),
}

export const nativeTheme = {
  shouldUseDarkColors: false,
  on: vi.fn(),
}

export const BrowserWindow = vi.fn(function BrowserWindow(this: any) {
  this.webContents = {
    send: vi.fn(),
    openDevTools: vi.fn(),
  }
  this.show = vi.fn()
})

export const session = {
  defaultSession: {},
}
