import type { StoragePlugin } from '@giopic/core'
import { createPinia, setActivePinia } from 'pinia'

import { vi } from 'vitest'
import { usePluginStore } from '~/stores/plugin'

describe('usePluginStore', () => {
  const mockPlugins: StoragePlugin[] = [
    {
      id: 'plugin-1',
      name: 'Cloudinary',
      type: 'cloudinary',
      enabled: true,
      version: '1.0.0',
      author: 'Author 1',
      description: 'Test plugin 1',
    },
    {
      id: 'plugin-2',
      name: 'Imgur',
      type: 'imgur',
      enabled: false,
      version: '1.0.0',
      author: 'Author 2',
      description: 'Test plugin 2',
    },
    {
      id: 'plugin-3',
      name: 'S3',
      type: 's3',
      enabled: true,
      version: '1.0.0',
      author: 'Author 3',
      description: 'Test plugin 3',
    },
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadPlugins fetches and sets plugins', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('get-all-plugins')
    expect(store.plugins).toEqual(mockPlugins)
    expect(store.loaded).toBe(true)
  })

  it('loadPlugins handles non-array response', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce({ invalid: 'data' })
    const store = usePluginStore()

    await store.loadPlugins()

    expect(console.error).toHaveBeenCalledWith('插件列表不是数组类型')
    expect(store.plugins).toEqual([])
    expect(store.loaded).toBe(false)
  })

  it('loadPlugins handles errors gracefully', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockRejectedValueOnce(new Error('Network error'))
    const store = usePluginStore()

    await store.loadPlugins()

    expect(console.error).toHaveBeenCalledWith('加载插件失败:', expect.any(Error))
    expect(store.plugins).toEqual([])
    expect(store.loaded).toBe(false)
  })

  it('loadPlugins skips if already loaded', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const firstCallCount = vi.mocked(window.ipcRenderer.invoke).mock.calls.length

    await store.loadPlugins()
    const secondCallCount = vi.mocked(window.ipcRenderer.invoke).mock.calls.length

    expect(firstCallCount).toBe(secondCallCount)
  })

  it('reloadPlugins forces reload', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    expect(store.loaded).toBe(true)

    store.reloadPlugins()
    expect(store.loaded).toBe(false)

    await store.reloadPlugins()
    expect(store.loaded).toBe(true)
  })

  it('getAllPlugins returns plugin list', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugins = store.getAllPlugins()

    expect(plugins).toEqual(mockPlugins)
  })

  it('getPlugin returns plugin by id', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugin = store.getPlugin('plugin-1')

    expect(plugin?.name).toBe('Cloudinary')
    expect(plugin?.type).toBe('cloudinary')
  })

  it('getPlugin returns undefined for non-existent', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugin = store.getPlugin('non-existent')

    expect(plugin).toBeUndefined()
  })

  it('getPluginsByType returns filtered list', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugins = store.getPluginsByType('cloudinary')

    expect(plugins).toHaveLength(1)
    expect(plugins[0].type).toBe('cloudinary')
  })

  it('getPluginsByType returns empty for non-existent type', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugins = store.getPluginsByType('non-existent')

    expect(plugins).toHaveLength(0)
  })

  it('getPluginNameByType returns name', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const name = store.getPluginNameByType('imgur')

    expect(name).toBe('Imgur')
  })

  it('getPluginNameByType returns empty string for non-existent', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()
    const name = store.getPluginNameByType('non-existent')

    expect(name).toBe('')
  })

  it('uninstallPlugin removes plugin from list', async () => {
    vi.mocked(window.ipcRenderer.invoke)
      .mockResolvedValueOnce(mockPlugins)
      .mockResolvedValueOnce(true)
    const store = usePluginStore()

    await store.loadPlugins()
    expect(store.plugins).toHaveLength(3)

    await store.uninstallPlugin('plugin-2')

    expect(store.plugins).toHaveLength(2)
    expect(store.plugins.find(p => p.id === 'plugin-2')).toBeUndefined()
  })

  it('uninstallPlugin does not remove if ipc returns false', async () => {
    vi.mocked(window.ipcRenderer.invoke)
      .mockResolvedValueOnce(mockPlugins)
      .mockResolvedValueOnce(false)
    const store = usePluginStore()

    await store.loadPlugins()
    await store.uninstallPlugin('plugin-1')

    expect(store.plugins).toHaveLength(3)
  })

  it('enablePlugin sets enabled to true', async () => {
    vi.mocked(window.ipcRenderer.invoke)
      .mockResolvedValueOnce(mockPlugins)
      .mockResolvedValueOnce(true)
    const store = usePluginStore()

    await store.loadPlugins()
    const plugin = store.getPlugin('plugin-2')
    expect(plugin?.enabled).toBe(false)

    await store.enablePlugin('plugin-2')

    expect(plugin?.enabled).toBe(true)
  })

  it('enablePlugin calls ipc with enable-plugin', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()

    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(true)
    await store.enablePlugin('plugin-2')

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('enable-plugin', 'plugin-2')
  })

  it('disablePlugin calls ipc with disable-plugin', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockPlugins)
    const store = usePluginStore()

    await store.loadPlugins()

    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(true)
    await store.disablePlugin('plugin-1')

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('disable-plugin', 'plugin-1')
  })
})
