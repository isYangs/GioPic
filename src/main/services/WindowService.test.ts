import type { BrowserWindow } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/main/stores', () => ({
  getStore: vi.fn(() => true),
}))

vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

const { WindowService } = await import('@/main/services/WindowService')

function createMockWindow(): BrowserWindow {
  return {
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
    isDestroyed: vi.fn(() => false),
    setSkipTaskbar: vi.fn(),
    webContents: {
      send: vi.fn(),
      on: vi.fn(),
      openDevTools: vi.fn(),
      isDestroyed: vi.fn(() => false),
    },
    on: vi.fn(),
    once: vi.fn(),
    setMenu: vi.fn(),
  } as unknown as BrowserWindow
}

describe('windowService', () => {
  let win: BrowserWindow
  let service: InstanceType<typeof WindowService>

  beforeEach(() => {
    vi.clearAllMocks()
    win = createMockWindow()
    service = new WindowService(win)
  })

  it('should create an instance', () => {
    expect(service).toBeDefined()
  })

  describe('openSetting', () => {
    it('should send open-setting event and show window', () => {
      service.openSetting()

      expect(win.webContents.send).toHaveBeenCalledWith('open-setting', undefined)
      expect(win.show).toHaveBeenCalled()
    })

    it('should pass tab parameter when provided', () => {
      service.openSetting('about')

      expect(win.webContents.send).toHaveBeenCalledWith('open-setting', 'about')
    })
  })

  describe('setDockIconVisible', () => {
    it('should call setSkipTaskbar on non-macOS', async () => {
      const { platform } = await import('@electron-toolkit/utils')
      Object.defineProperty(platform, 'isMacOS', { value: false, configurable: true })

      service.setDockIconVisible(false)

      expect(win.setSkipTaskbar).toHaveBeenCalledWith(true)
    })
  })
})
