import { vi } from 'vitest'

vi.mock('electron', () => {
  const invoke = vi.fn()
  const on = vi.fn()
  const handle = vi.fn()
  const send = vi.fn()

  return {
    app: {
      getPath: vi.fn((key: string) => `/mock/${key}`),
      getName: vi.fn(() => 'GioPic'),
      getVersion: vi.fn(() => '0.0.1'),
      isPackaged: false,
      on: vi.fn(),
      quit: vi.fn(),
      setLoginItemSettings: vi.fn(),
    },
    ipcMain: {
      handle,
      on,
      once: vi.fn(),
      removeHandler: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    ipcRenderer: {
      invoke,
      on,
      once: vi.fn(),
      send,
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      close: vi.fn(),
      destroy: vi.fn(),
      isDestroyed: vi.fn(() => false),
      webContents: {
        send: vi.fn(),
        on: vi.fn(),
        openDevTools: vi.fn(),
        isDestroyed: vi.fn(() => false),
      },
      on: vi.fn(),
      once: vi.fn(),
      setMenu: vi.fn(),
    })),
    Menu: {
      buildFromTemplate: vi.fn(() => ({ append: vi.fn() })),
      setApplicationMenu: vi.fn(),
      getApplicationMenu: vi.fn(() => ({ append: vi.fn() })),
    },
    Tray: vi.fn().mockImplementation(() => ({
      setContextMenu: vi.fn(),
      setToolTip: vi.fn(),
      setImage: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    })),
    dialog: {
      showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
      showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
      showErrorBox: vi.fn(),
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(undefined),
      showItemInFolder: vi.fn(),
      openPath: vi.fn().mockResolvedValue(''),
    },
    nativeTheme: {
      themeSource: 'system' as const,
      shouldUseDarkColors: false,
      on: vi.fn(),
    },
    globalShortcut: {
      register: vi.fn(() => true),
      unregister: vi.fn(),
      unregisterAll: vi.fn(),
      isRegistered: vi.fn(() => false),
    },
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(() => ''),
      writeImage: vi.fn(),
    },
    contextBridge: {
      exposeInMainWorld: vi.fn(),
    },
    MenuItem: vi.fn(),
    nativeImage: {
      createFromPath: vi.fn(() => 'mock-image'),
      createEmpty: vi.fn(() => 'empty-image'),
    },
  }
})

vi.mock('@electron-toolkit/utils', () => ({
  platform: {
    isMacOS: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
  },
  is: {
    dev: true,
  },
  electronApp: {
    setAutoLaunch: vi.fn(),
  },
}))
