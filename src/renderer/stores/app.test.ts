import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

import { useAppStore } from '~/stores/app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(undefined)
  })

  it('creates store with default values', () => {
    const store = useAppStore()

    expect(store.appCloseType).toBe('hide')
    expect(store.autoStart).toBe(false)
    expect(store.autoUpdate).toBe(true)
    expect(store.themeType).toBe('light')
    expect(store.showDockIcon).toBe(true)
    expect(store.isDevToolsEnabled).toBe(true)
    expect(store.defaultProgram).toBeNull()
    expect(store.isMenuCollapsed).toBe(false)
  })

  it('setState updates specific fields', () => {
    const store = useAppStore()

    store.setState({ appCloseType: 'close', autoStart: true })

    expect(store.appCloseType).toBe('close')
    expect(store.autoStart).toBe(true)
  })

  it('setState does not affect other fields', () => {
    const store = useAppStore()
    const originalTheme = store.themeType

    store.setState({ appCloseType: 'close' })

    expect(store.themeType).toBe(originalTheme)
    expect(store.autoUpdate).toBe(true)
  })

  it('resetState calls ipcRenderer.invoke with reset-settings', async () => {
    const store = useAppStore()

    await store.resetState()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('reset-settings')
  })

  it('handles multiple setState calls sequentially', () => {
    const store = useAppStore()

    store.setState({ appCloseType: 'close' })
    store.setState({ autoStart: true })
    store.setState({ themeType: 'dark' })

    expect(store.appCloseType).toBe('close')
    expect(store.autoStart).toBe(true)
    expect(store.themeType).toBe('dark')
  })

  it('setState merges new values without resetting unmodified fields', () => {
    const store = useAppStore()

    store.setState({ npmRegistry: 'taobao', customNpmRegistry: 'https://example.com' })

    expect(store.npmRegistry).toBe('taobao')
    expect(store.customNpmRegistry).toBe('https://example.com')
    expect(store.autoUpdate).toBe(true)
  })
})
