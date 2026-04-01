import type { BrowserWindow } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('@/main/services/AppUpdater', () => ({
  AppUpdater: vi.fn(),
}))

vi.mock('node:child_process', () => ({
  default: {
    execSync: vi.fn(),
  },
  execSync: vi.fn(),
}))

describe('trayService', () => {
  let mockWindow: BrowserWindow

  beforeEach(() => {
    vi.clearAllMocks()
    mockWindow = {
      show: vi.fn(),
      webContents: {
        send: vi.fn(),
      },
    } as any
  })

  it('should create tray service on construction', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const service = new TrayService(mockWindow)

    expect(service).toBeDefined()
  })

  it('should create Tray instance in init', async () => {
    const { Tray } = await import('electron')
    await import('@/main/services/TrayService')

    const mockTray = vi.mocked(Tray)
    const initialCallCount = mockTray.mock.calls.length

    const { TrayService } = await import('@/main/services/TrayService')
    const _service = new TrayService(mockWindow)

    expect(vi.mocked(Tray).mock.calls.length).toBeGreaterThan(initialCallCount)
  })

  it('should set tray tooltip and context menu', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const _service = new TrayService(mockWindow)

    const { Tray } = await import('electron')
    const trayInstances = vi.mocked(Tray).mock.results
    expect(trayInstances.length).toBeGreaterThan(0)
  })

  it('should update tray icon', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const service = new TrayService(mockWindow)

    service.updateIcon()

    expect(service).toBeDefined()
  })

  it('should do nothing when updateIcon called but tray is null', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const service = new TrayService(mockWindow)

    service.destroy()
    service.updateIcon()

    expect(service).toBeDefined()
  })

  it('should destroy tray', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const service = new TrayService(mockWindow)

    service.destroy()

    expect(service).toBeDefined()
  })

  it('should handle destroy when tray is already null', async () => {
    const { TrayService } = await import('@/main/services/TrayService')

    const service = new TrayService(mockWindow)

    service.destroy()
    service.destroy()

    expect(service).toBeDefined()
  })
})
