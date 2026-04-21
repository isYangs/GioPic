import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

import { createPluginDataStoreAdapter, syncPluginDataFromMain, usePluginDataStore } from '~/stores/plugin-data'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePluginDataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(undefined)
  })

  it('setData stores data nested under pluginId.key', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })

    expect(store.pluginData['plugin-1']['setting-1']).toEqual({ value: 'test' })
  })

  it('setData creates plugin entry if not exists', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })

    expect(store.pluginData['plugin-1']).toBeDefined()
    expect(Object.keys(store.pluginData['plugin-1'])).toContain('setting-1')
  })

  it('setData overwrites existing data', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'first' })
    store.setData('plugin-1', 'setting-1', { value: 'second' })

    expect(store.pluginData['plugin-1']['setting-1']).toEqual({ value: 'second' })
  })

  it('getData retrieves nested data', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })
    const data = store.getData('plugin-1', 'setting-1')

    expect(data).toEqual({ value: 'test' })
  })

  it('getData returns undefined for missing', () => {
    const store = usePluginDataStore()

    const data = store.getData('plugin-1', 'setting-1')

    expect(data).toBeUndefined()
  })

  it('removeData deletes key', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })
    store.removeData('plugin-1', 'setting-1')

    expect(store.getData('plugin-1', 'setting-1')).toBeUndefined()
  })

  it('removeData does nothing if plugin not exists', () => {
    const store = usePluginDataStore()

    store.removeData('plugin-1', 'setting-1')

    expect(store.pluginData['plugin-1']).toBeUndefined()
  })

  it('getAllData returns all data for plugin', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test1' })
    store.setData('plugin-1', 'setting-2', { value: 'test2' })

    const allData = store.getAllData('plugin-1')

    expect(allData).toEqual({
      'setting-1': { value: 'test1' },
      'setting-2': { value: 'test2' },
    })
  })

  it('getAllData returns empty object for non-existent plugin', () => {
    const store = usePluginDataStore()

    const allData = store.getAllData('plugin-1')

    expect(allData).toEqual({})
  })

  it('removeProgramData removes matching keys for given programId', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', '123-setting-1', { value: 'test' })
    store.setData('plugin-1', '123-setting-2', { value: 'test' })
    store.setData('plugin-1', '456-setting-1', { value: 'test' })
    store.setData('plugin-2', '123-setting-1', { value: 'test' })
    store.setData('plugin-2', '999-setting-1', { value: 'other' })

    store.removeProgramData(123)

    expect(store.pluginData['plugin-1']['123-setting-1']).toBeUndefined()
    expect(store.pluginData['plugin-1']['123-setting-2']).toBeUndefined()
    expect(store.pluginData['plugin-1']['456-setting-1']).toBeDefined()
    expect(store.pluginData['plugin-2']['123-setting-1']).toBeUndefined()
    expect(store.pluginData['plugin-2']['999-setting-1']).toBeDefined()
  })

  it('removeProgramData removes empty plugin entries', () => {
    const store = usePluginDataStore()

    store.setData('plugin-1', '123-setting', { value: 'test' })
    store.setData('plugin-2', 'other-setting', { value: 'test' })

    store.removeProgramData(123)

    expect(store.pluginData['plugin-1']).toBeUndefined()
    expect(store.pluginData['plugin-2']).toBeDefined()
  })

  it('syncFromMain fetches and updates store', async () => {
    const mockData = { 'setting-1': { value: 'test' }, 'setting-2': { value: 'test2' } }
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockData)
    const store = usePluginDataStore()

    await store.syncFromMain('plugin-1')

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('get-all-plugin-data', 'plugin-1')
    expect(store.pluginData['plugin-1']).toEqual(mockData)
  })

  it('syncFromMain ignores empty response', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce({})
    const store = usePluginDataStore()

    store.setData('plugin-1', 'existing', { value: 'test' })
    await store.syncFromMain('plugin-1')

    expect(store.getData('plugin-1', 'existing')).toEqual({ value: 'test' })
  })

  it('syncToMain calls ipcRenderer.invoke', () => {
    const store = usePluginDataStore()

    store.syncToMain('plugin-1', 'setting-1', { value: 'test' })

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      'set-plugin-data',
      {
        pluginId: 'plugin-1',
        key: 'setting-1',
        data: { value: 'test' },
      },
    )
  })

  it('syncToMain handles errors gracefully', async () => {
    vi.mocked(window.ipcRenderer.invoke).mockRejectedValueOnce(new Error('Sync failed'))
    const store = usePluginDataStore()

    store.syncToMain('plugin-1', 'setting-1', { value: 'test' })
    await Promise.resolve()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      'set-plugin-data',
      {
        pluginId: 'plugin-1',
        key: 'setting-1',
        data: { value: 'test' },
      },
    )
    expect(console.error).toHaveBeenCalledWith('同步数据到主进程失败: plugin-1.setting-1', expect.any(Error))
  })
})

describe('createPluginDataStoreAdapter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(undefined)
  })

  it('delegates setData correctly', () => {
    const adapter = createPluginDataStoreAdapter()

    adapter.setData('plugin-1', 'setting-1', { value: 'test' })

    const store = usePluginDataStore()
    expect(store.getData('plugin-1', 'setting-1')).toEqual({ value: 'test' })
  })

  it('calls syncToMain when setData is called', () => {
    const adapter = createPluginDataStoreAdapter()

    adapter.setData('plugin-1', 'setting-1', { value: 'test' })

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      'set-plugin-data',
      {
        pluginId: 'plugin-1',
        key: 'setting-1',
        data: { value: 'test' },
      },
    )
  })

  it('delegates getData correctly', () => {
    const adapter = createPluginDataStoreAdapter()
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })
    const data = adapter.getData('plugin-1', 'setting-1')

    expect(data).toEqual({ value: 'test' })
  })

  it('delegates removeData correctly', () => {
    const adapter = createPluginDataStoreAdapter()
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test' })
    adapter.removeData('plugin-1', 'setting-1')

    expect(store.getData('plugin-1', 'setting-1')).toBeUndefined()
  })

  it('delegates getAllData correctly', () => {
    const adapter = createPluginDataStoreAdapter()
    const store = usePluginDataStore()

    store.setData('plugin-1', 'setting-1', { value: 'test1' })
    store.setData('plugin-1', 'setting-2', { value: 'test2' })

    const allData = adapter.getAllData('plugin-1')

    expect(allData).toEqual({
      'setting-1': { value: 'test1' },
      'setting-2': { value: 'test2' },
    })
  })
})

describe('syncPluginDataFromMain', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue({})
  })

  it('calls syncFromMain on store', async () => {
    const mockData = { 'setting-1': { value: 'test' } }
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValueOnce(mockData)

    await syncPluginDataFromMain('plugin-1')

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith('get-all-plugin-data', 'plugin-1')
    const store = usePluginDataStore()
    expect(store.getData('plugin-1', 'setting-1')).toEqual({ value: 'test' })
  })
})
