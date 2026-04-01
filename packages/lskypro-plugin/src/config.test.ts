import { pluginDataStore, request } from '@giopic/core'
import { lskyproSettingSchema } from '@pkg-lskypro/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@giopic/core', async () => {
  const actual = await vi.importActual('@giopic/core')
  return {
    ...actual,
    request: vi.fn(),
    pluginDataStore: {
      setData: vi.fn(),
      getData: vi.fn(),
      removeData: vi.fn(),
      getAllData: vi.fn(),
    },
  }
})

describe('lskypro-plugin config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lskyproSettingSchema', () => {
    it('should have correct structure', () => {
      expect(lskyproSettingSchema).toBeDefined()
      expect(lskyproSettingSchema.items).toBeInstanceOf(Array)
      expect(lskyproSettingSchema.items.length).toBeGreaterThan(0)
    })

    it('should have required fields', () => {
      const fields = lskyproSettingSchema.items.map(item => item.field)
      expect(fields).toContain('api')
      expect(fields).toContain('token')
      expect(fields).toContain('strategies')
    })

    it('should have api field configured correctly', () => {
      const apiField = lskyproSettingSchema.items.find(item => item.field === 'api')
      expect(apiField).toBeDefined()
      expect(apiField?.type).toBe('text')
      expect(apiField?.required).toBe(true)
    })

    it('should have token field configured correctly', () => {
      const tokenField = lskyproSettingSchema.items.find(item => item.field === 'token')
      expect(tokenField).toBeDefined()
      expect(tokenField?.type).toBe('text')
      expect(tokenField?.required).toBe(true)
    })

    it('should have strategies field as custom-selector', () => {
      const strategiesField = lskyproSettingSchema.items.find(item => item.field === 'strategies')
      expect(strategiesField).toBeDefined()
      expect(strategiesField?.type).toBe('custom-selector')
      expect(strategiesField?.customMethod).toBe('getStrategies')
      expect(strategiesField?.required).toBe(true)
    })

    it('should have default values', () => {
      expect(lskyproSettingSchema.defaultValues).toBeDefined()
      expect(lskyproSettingSchema.defaultValues?.api).toBe('')
      expect(lskyproSettingSchema.defaultValues?.token).toBe('')
      expect(lskyproSettingSchema.defaultValues?.defaultPermission).toBe(1)
    })

    it('should have shouldDisablePermissionSelect function', () => {
      expect(lskyproSettingSchema.shouldDisablePermissionSelect).toBeDefined()
      expect(lskyproSettingSchema.shouldDisablePermissionSelect).toBeInstanceOf(Function)
    })
  })

  describe('getStrategies custom method', () => {
    it('should get strategies successfully', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Success',
        data: {
          storages: [
            { id: 1, name: 'Local Storage' },
            { id: 2, name: 'S3 Storage' },
          ],
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const getStrategies = lskyproSettingSchema.customMethods?.getStrategies
      expect(getStrategies).toBeDefined()

      if (getStrategies) {
        const result = await getStrategies({
          api: 'https://api.example.com',
          token: 'test-token',
        })

        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
        expect(result[0]).toHaveProperty('label')
        expect(result[0]).toHaveProperty('value')
        expect(pluginDataStore.setData).toHaveBeenCalled()
      }
    })

    it('should throw error when api or token is missing', async () => {
      const getStrategies = lskyproSettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await expect(
          getStrategies({ api: '', token: '' }),
        ).rejects.toThrow('请先配置API地址和Token')
      }
    })

    it('should handle API error response', async () => {
      vi.mocked(request).mockResolvedValue({
        data: {
          status: 'error',
          message: 'Unauthorized',
        },
        status: 401,
      })

      const getStrategies = lskyproSettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await expect(
          getStrategies({
            api: 'https://api.example.com',
            token: 'invalid-token',
          }),
        ).rejects.toThrow()
      }
    })

    it('should handle invalid data structure', async () => {
      vi.mocked(request).mockResolvedValue({
        data: {
          status: 'success',
          data: {
            storages: 'not-an-array',
          },
        },
        status: 200,
      })

      const getStrategies = lskyproSettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await expect(
          getStrategies({
            api: 'https://api.example.com',
            token: 'test-token',
          }),
        ).rejects.toThrow('API返回的存储策略数据格式不正确')
      }
    })

    it('should save strategies to pluginDataStore', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          storages: [
            { id: 1, name: 'Local Storage' },
          ],
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const getStrategies = lskyproSettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await getStrategies({
          api: 'https://api.example.com',
          token: 'test-token',
        })

        expect(pluginDataStore.setData).toHaveBeenCalledWith(
          'giopic-lskypro',
          expect.any(String),
          mockResponse.data.storages,
        )
      }
    })
  })
})
