import type { BrowserWindow } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron-updater', () => ({
  default: {
    autoUpdater: {
      setFeedURL: vi.fn(),
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      quitAndInstall: vi.fn(),
      on: vi.fn(),
      autoDownload: false,
      autoInstallOnAppQuit: false,
      updateConfigPath: '',
    },
  },
}))

vi.mock('node:https', () => ({
  default: {
    get: vi.fn(),
  },
}))

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

describe('appUpdater', () => {
  let mockWindow: BrowserWindow

  beforeEach(() => {
    vi.clearAllMocks()
    mockWindow = {
      webContents: {
        send: vi.fn(),
      },
      once: vi.fn(),
    } as any
  })

  it('should create AppUpdater instance', async () => {
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const updater = new AppUpdater(mockWindow)

    expect(updater).toBeDefined()
  })

  it('should set autoDownload to false', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    expect(pkg.default.autoUpdater.autoDownload).toBe(false)
  })

  it('should set autoInstallOnAppQuit to false', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    expect(pkg.default.autoUpdater.autoInstallOnAppQuit).toBe(false)
  })

  it('should call checkForUpdates method', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')
    vi.mocked(pkg.default.autoUpdater.checkForUpdates).mockResolvedValue({} as any)

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const updater = new AppUpdater(mockWindow)
    await updater.checkForUpdates()

    expect(pkg.default.autoUpdater.checkForUpdates).toHaveBeenCalled()
  })

  it('should setup update server with cn source', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('cn')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    expect(pkg.default.autoUpdater.setFeedURL).toHaveBeenCalledWith({
      provider: 'generic',
      url: 'https://update.isyangs.cn/',
      channel: 'latest',
    })
  })

  it('should setup update server with github source', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    // GitHub source does not call setFeedURL (uses default GitHub provider)
    expect(pkg.default.autoUpdater.setFeedURL).not.toHaveBeenCalled()
  })

  it('should register ipcMain event listeners', async () => {
    const { ipcMain } = await import('electron')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    expect(ipcMain.on).toHaveBeenCalledWith('change-update-source', expect.any(Function))
    expect(ipcMain.on).toHaveBeenCalledWith('check-for-update', expect.any(Function))
  })

  it('should register autoUpdater event listeners', async () => {
    const pkg = await import('electron-updater')
    const { getStore } = await import('@/main/stores')

    vi.mocked(getStore).mockReturnValue('github')

    const { AppUpdater } = await import('@/main/services/AppUpdater')

    const _updater = new AppUpdater(mockWindow)

    expect(pkg.default.autoUpdater.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(pkg.default.autoUpdater.on).toHaveBeenCalledWith('checking-for-update', expect.any(Function))
    expect(pkg.default.autoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function))
  })
})
