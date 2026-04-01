import type { PluginDataStore } from '@pkg-core/types'
import { getPluginDataStore, pluginDataStore, setPluginDataStore } from '@pkg-core/plugin-data-store'
import { describe, expect, it, vi } from 'vitest'

describe('plugin-data-store', () => {
  describe('setPluginDataStore and getPluginDataStore', () => {
    it('should set and get plugin data store', () => {
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn(),
        removeData: vi.fn(),
        getAllData: vi.fn(),
      }

      setPluginDataStore(mockStore)
      const store = getPluginDataStore()
      expect(store).toBe(mockStore)
    })

    it('should throw error when store not initialized', () => {
      // 首先清除已设置的 store
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn(),
        removeData: vi.fn(),
        getAllData: vi.fn(),
      }
      setPluginDataStore(mockStore)

      // 现在可以正常获取
      expect(() => getPluginDataStore()).not.toThrow()
    })
  })

  describe('pluginDataStore', () => {
    it('should call setData on the global store', () => {
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn(),
        removeData: vi.fn(),
        getAllData: vi.fn(),
      }
      setPluginDataStore(mockStore)

      pluginDataStore.setData('test-plugin', 'key1', { value: 'test' })
      expect(mockStore.setData).toHaveBeenCalledWith('test-plugin', 'key1', { value: 'test' })
    })

    it('should call getData on the global store', () => {
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue({ value: 'test' }),
        removeData: vi.fn(),
        getAllData: vi.fn(),
      }
      setPluginDataStore(mockStore)

      const result = pluginDataStore.getData('test-plugin', 'key1')
      expect(mockStore.getData).toHaveBeenCalledWith('test-plugin', 'key1')
      expect(result).toEqual({ value: 'test' })
    })

    it('should call removeData on the global store', () => {
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn(),
        removeData: vi.fn(),
        getAllData: vi.fn(),
      }
      setPluginDataStore(mockStore)

      pluginDataStore.removeData('test-plugin', 'key1')
      expect(mockStore.removeData).toHaveBeenCalledWith('test-plugin', 'key1')
    })

    it('should call getAllData on the global store', () => {
      const mockStore: PluginDataStore = {
        setData: vi.fn(),
        getData: vi.fn(),
        removeData: vi.fn(),
        getAllData: vi.fn().mockReturnValue({ key1: 'value1', key2: 'value2' }),
      }
      setPluginDataStore(mockStore)

      const result = pluginDataStore.getAllData('test-plugin')
      expect(mockStore.getAllData).toHaveBeenCalledWith('test-plugin')
      expect(result).toEqual({ key1: 'value1', key2: 'value2' })
    })
  })
})
