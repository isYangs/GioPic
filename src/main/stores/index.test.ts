import { ipcMain } from 'electron'

import { mockMethods } from 'electron-store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearStore, getStore, initStore, setStore } from '@/main/stores'

vi.mock('electron-store', () => {
  const mockMethods = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  }

  class MockStore {
    get = mockMethods.get
    set = mockMethods.set
    delete = mockMethods.delete
    clear = mockMethods.clear
  }

  return { default: MockStore, mockMethods }
})

const mockStoreInstance = mockMethods

describe('store Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStore', () => {
    it('should return value from nested store data', () => {
      mockStoreInstance.get.mockReturnValue({ userId: 'user123' })
      const result = getStore('userId')
      expect(result).toBe('user123')
      expect(mockStoreInstance.get).toHaveBeenCalledWith('__giopic_app_store__')
    })

    it('should return key itself on error', () => {
      mockStoreInstance.get.mockImplementation(() => {
        throw new Error('Store error')
      })
      const result = getStore('someKey')
      expect(result).toBe('someKey')
    })

    it('should return undefined for non-existent key', () => {
      mockStoreInstance.get.mockReturnValue({ userId: 'user123' })
      const result = getStore('nonExistent')
      expect(result).toBeUndefined()
    })

    it('should work with custom storeKey', () => {
      mockStoreInstance.get.mockReturnValue({ theme: 'dark' })
      const result = getStore('theme', 'customKey')
      expect(result).toBe('dark')
      expect(mockStoreInstance.get).toHaveBeenCalledWith('customKey')
    })
  })

  describe('setStore', () => {
    it('should set value in nested store data', () => {
      mockStoreInstance.get.mockReturnValue({ existingKey: 'existingValue' })
      setStore('newKey', 'newValue')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('__giopic_app_store__', {
        existingKey: 'existingValue',
        newKey: 'newValue',
      })
    })

    it('should create new object if store is empty', () => {
      mockStoreInstance.get.mockReturnValue(undefined)
      setStore('key', 'value')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('__giopic_app_store__', { key: 'value' })
    })

    it('should overwrite existing key', () => {
      mockStoreInstance.get.mockReturnValue({ key: 'oldValue' })
      setStore('key', 'newValue')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('__giopic_app_store__', { key: 'newValue' })
    })

    it('should work with custom storeKey', () => {
      mockStoreInstance.get.mockReturnValue(null)
      setStore('key', 'value', 'customKey')
      expect(mockStoreInstance.set).toHaveBeenCalledWith('customKey', { key: 'value' })
    })

    it('should handle complex values', () => {
      mockStoreInstance.get.mockReturnValue({})
      const complexValue = { nested: { data: [1, 2, 3] } }
      setStore('config', complexValue)
      expect(mockStoreInstance.set).toHaveBeenCalledWith('__giopic_app_store__', { config: complexValue })
    })

    it('should catch and log errors silently', () => {
      mockStoreInstance.get.mockImplementation(() => {
        throw new Error('Store error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      setStore('key', 'value')
      expect(consoleSpy).toHaveBeenCalled()
      expect(mockStoreInstance.set).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('clearStore', () => {
    it('should call store.clear()', () => {
      clearStore()
      expect(mockStoreInstance.clear).toHaveBeenCalled()
    })
  })

  describe('initStore', () => {
    it('should have 3 handlers registered', () => {
      vi.clearAllMocks()
      initStore()
      const calls = vi.mocked(ipcMain.handle).mock.calls
      expect(calls).toHaveLength(3)
      expect(calls[0][0]).toBe('get-store')
      expect(calls[1][0]).toBe('set-store')
      expect(calls[2][0]).toBe('delete-store')
    })

    it('get-store handler should retrieve value from store', async () => {
      mockStoreInstance.get.mockReturnValue('storedValue')
      initStore()
      const handler = vi.mocked(ipcMain.handle).mock.calls[0][1]
      const result = handler({} as any, 'someKey')
      expect(result).toBe('storedValue')
      expect(mockStoreInstance.get).toHaveBeenCalledWith('someKey')
    })

    it('set-store handler should parse and store value', async () => {
      initStore()
      const handler = vi.mocked(ipcMain.handle).mock.calls[1][1]
      handler({} as any, { key: 'testKey', value: '{"data":"test"}' })
      expect(mockStoreInstance.set).toHaveBeenCalledWith('testKey', { data: 'test' })
    })

    it('delete-store handler should delete from store', async () => {
      initStore()
      const handler = vi.mocked(ipcMain.handle).mock.calls[2][1]
      handler({} as any, 'testKey')
      expect(mockStoreInstance.delete).toHaveBeenCalledWith('testKey')
    })
  })
})
