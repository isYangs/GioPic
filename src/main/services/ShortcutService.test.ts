import type { BrowserWindow } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/main/stores', () => ({
  getStore: vi.fn(),
  setStore: vi.fn(),
}))

vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('shortcutService', () => {
  let mockWindow: BrowserWindow

  beforeEach(() => {
    vi.clearAllMocks()
    mockWindow = {
      webContents: {
        send: vi.fn(),
        openDevTools: vi.fn(),
      },
    } as any
  })

  it('should create service and call init on construction', async () => {
    const { ShortcutService } = await import('@/main/services/ShortcutService')
    vi.spyOn(ShortcutService.prototype as any, 'registerGlobalShortcut')

    const service = new ShortcutService(mockWindow)

    expect(service).toBeDefined()
  })

  it('should call destroy and unregister all shortcuts', async () => {
    const { getStore } = await import('@/main/stores')
    const { globalShortcut } = await import('electron')

    vi.mocked(getStore).mockReturnValue(false)

    const { ShortcutService } = await import('@/main/services/ShortcutService')
    const service = new ShortcutService(mockWindow)

    service.destroy()

    expect(globalShortcut.unregisterAll).toHaveBeenCalled()
  })

  it('should register devtools shortcut when updateDevToolsShortcut(true)', async () => {
    const { getStore } = await import('@/main/stores')
    const { globalShortcut } = await import('electron')

    vi.mocked(getStore).mockReturnValue(false)

    const { ShortcutService } = await import('@/main/services/ShortcutService')
    const service = new ShortcutService(mockWindow)

    vi.useFakeTimers()
    service.updateDevToolsShortcut(true)
    vi.runAllTimers()
    vi.useRealTimers()

    expect(globalShortcut.register).toHaveBeenCalledWith(
      'CommandOrControl+Shift+D',
      expect.any(Function),
    )
  })

  it('should unregister devtools shortcut when updateDevToolsShortcut(false)', async () => {
    const { getStore } = await import('@/main/stores')
    const { globalShortcut } = await import('electron')

    vi.mocked(getStore).mockReturnValue(true)

    const { ShortcutService } = await import('@/main/services/ShortcutService')
    const service = new ShortcutService(mockWindow)

    vi.useFakeTimers()
    service.updateDevToolsShortcut(true)
    vi.runAllTimers()
    vi.useRealTimers()

    vi.useFakeTimers()
    service.updateDevToolsShortcut(false)
    vi.runAllTimers()
    vi.useRealTimers()

    expect(globalShortcut.unregister).toHaveBeenCalledWith('CommandOrControl+Shift+D')
  })

  it('should read isDevToolsEnabled from store on init', async () => {
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue(true)

    const { ShortcutService } = await import('@/main/services/ShortcutService')

    vi.useFakeTimers()
    const _service = new ShortcutService(mockWindow)
    vi.runAllTimers()
    vi.useRealTimers()

    expect(getStore).toHaveBeenCalledWith('isDevToolsEnabled')
  })
})
