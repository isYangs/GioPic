import { mockMethods } from 'electron-store'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMainPluginDataStoreAdapter } from '@/main/stores/plugin-data'

vi.mock('electron-store', () => {
  const mockMethods = {
    get: vi.fn(),
    set: vi.fn(),
  }

  class MockStore {
    get = mockMethods.get
    set = mockMethods.set
  }

  return { default: MockStore, mockMethods }
})

const mockStoreInstance = mockMethods!

describe('plugin Data Store Adapter', () => {
  let adapter: ReturnType<typeof createMainPluginDataStoreAdapter>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = createMainPluginDataStoreAdapter()
  })

  describe('setData', () => {
    it('should store data nested under pluginId.key', () => {
      mockStoreInstance.get.mockReturnValue({})
      adapter.setData('plugin1', 'config', { theme: 'dark' })
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { config: { theme: 'dark' } },
      })
    })

    it('should create plugin entry if not exists', () => {
      mockStoreInstance.get.mockReturnValue({})
      adapter.setData('newPlugin', 'key', 'value')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        newPlugin: { key: 'value' },
      })
    })

    it('should preserve existing plugin data when adding new key', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { existingKey: 'existingValue' } })
      adapter.setData('plugin1', 'newKey', 'newValue')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { existingKey: 'existingValue', newKey: 'newValue' },
      })
    })

    it('should overwrite existing key in plugin', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key: 'oldValue' } })
      adapter.setData('plugin1', 'key', 'newValue')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { key: 'newValue' },
      })
    })

    it('should handle complex nested objects', () => {
      mockStoreInstance.get.mockReturnValue({})
      const complexData = { nested: { deep: { data: [1, 2, 3] } } }
      adapter.setData('plugin1', 'config', complexData)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { config: complexData },
      })
    })
  })

  describe('getData', () => {
    it('should retrieve nested data', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { config: { theme: 'dark' } } })
      const result = adapter.getData('plugin1', 'config')
      expect(result).toEqual({ theme: 'dark' })
    })

    it('should return undefined for non-existent plugin', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key: 'value' } })
      const result = adapter.getData('nonExistent', 'key')
      expect(result).toBeUndefined()
    })

    it('should return undefined for non-existent key', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { existingKey: 'value' } })
      const result = adapter.getData('plugin1', 'nonExistent')
      expect(result).toBeUndefined()
    })

    it('should return undefined from empty store', () => {
      mockStoreInstance.get.mockReturnValue({})
      const result = adapter.getData('plugin1', 'key')
      expect(result).toBeUndefined()
    })

    it('should handle null values', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key: null } })
      const result = adapter.getData('plugin1', 'key')
      expect(result).toBeNull()
    })
  })

  describe('removeData', () => {
    it('should delete specific key', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key1: 'value1', key2: 'value2' } })
      adapter.removeData('plugin1', 'key1')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { key2: 'value2' },
      })
    })

    it('should do nothing if plugin does not exist', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key: 'value' } })
      adapter.removeData('nonExistent', 'key')
      expect(mockStoreInstance.set).not.toHaveBeenCalled()
    })

    it('should do nothing if key does not exist in plugin', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { existingKey: 'value' } })
      adapter.removeData('plugin1', 'nonExistent')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { existingKey: 'value' },
      })
    })

    it('should handle removing from plugin with multiple keys', () => {
      mockStoreInstance.get.mockReturnValue({
        plugin1: { key1: 'val1', key2: 'val2', key3: 'val3' },
      })
      adapter.removeData('plugin1', 'key2')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { key1: 'val1', key3: 'val3' },
      })
    })
  })

  describe('getAllData', () => {
    it('should return all data for a plugin', () => {
      const pluginData = { key1: 'value1', key2: 'value2' }
      mockStoreInstance.get.mockReturnValue({ plugin1: pluginData })
      const result = adapter.getAllData('plugin1')
      expect(result).toEqual(pluginData)
    })

    it('should return empty object for non-existent plugin', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { key: 'value' } })
      const result = adapter.getAllData('nonExistent')
      expect(result).toEqual({})
    })

    it('should return empty object from empty store', () => {
      mockStoreInstance.get.mockReturnValue({})
      const result = adapter.getAllData('plugin1')
      expect(result).toEqual({})
    })

    it('should return all data including nested objects', () => {
      const complexData = { key1: 'value1', key2: { nested: 'data' }, key3: [1, 2, 3] }
      mockStoreInstance.get.mockReturnValue({ plugin1: complexData })
      const result = adapter.getAllData('plugin1')
      expect(result).toEqual(complexData)
    })
  })

  describe('removeProgramData', () => {
    it('should remove keys matching programId pattern', () => {
      mockStoreInstance.get.mockReturnValue({
        plugin1: { '1-config': 'data1', '1-settings': 'data2', '2-config': 'data3', 'other': 'data4' },
      })
      adapter.removeProgramData(1)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { '2-config': 'data3', 'other': 'data4' },
      })
    })

    it('should remove empty plugin entries after cleanup', () => {
      mockStoreInstance.get.mockReturnValue({
        plugin1: { '1-config': 'data' },
        plugin2: { '2-config': 'data' },
      })
      adapter.removeProgramData(1)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin2: { '2-config': 'data' },
      })
    })

    it('should not save if no changes made', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { other: 'data' } })
      adapter.removeProgramData(1)
      expect(mockStoreInstance.set).not.toHaveBeenCalled()
    })

    it('should handle multiple plugins with matching keys', () => {
      mockStoreInstance.get.mockReturnValue({
        plugin1: { '5-a': 'val1', '5-b': 'val2', 'keep': 'val3' },
        plugin2: { '5-c': 'val4', 'other': 'val5' },
        plugin3: { '3-x': 'val6' },
      })
      adapter.removeProgramData(5)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { keep: 'val3' },
        plugin2: { other: 'val5' },
        plugin3: { '3-x': 'val6' },
      })
    })

    it('should remove all program entries if they are the only keys', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { '7-a': 'v1', '7-b': 'v2' } })
      adapter.removeProgramData(7)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {})
    })

    it('should handle programId 0', () => {
      mockStoreInstance.get.mockReturnValue({ plugin1: { '0-config': 'data', 'other': 'val' } })
      adapter.removeProgramData(0)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { other: 'val' },
      })
    })

    it('should preserve keys that do not match pattern', () => {
      mockStoreInstance.get.mockReturnValue({
        plugin1: { '3-a': 'remove1', '3-b': 'remove2', '3c': 'keep1', 'config': 'keep2', '3d-extra': 'keep3' },
      })
      adapter.removeProgramData(3)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('pluginData', {
        plugin1: { '3c': 'keep1', 'config': 'keep2', '3d-extra': 'keep3' },
      })
    })
  })
})
