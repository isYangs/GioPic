import { pluginDataStore, request } from '@giopic/core'
import { lskySettingSchema } from '@pkg-lsky/config'
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

describe('lsky-plugin config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lskySettingSchema', () => {
    it('should have correct structure', () => {
      expect(lskySettingSchema).toBeDefined()
      expect(lskySettingSchema.items).toBeInstanceOf(Array)
      expect(lskySettingSchema.items.length).toBeGreaterThan(0)
    })

    it('should have required fields', () => {
      const fields = lskySettingSchema.items.map(item => item.field)
      expect(fields).toContain('api')
      expect(fields).toContain('token')
      expect(fields).toContain('strategies')
    })

    it('should have api field configured correctly', () => {
      const apiField = lskySettingSchema.items.find(item => item.field === 'api')
      expect(apiField).toBeDefined()
      expect(apiField?.type).toBe('text')
      expect(apiField?.required).toBe(true)
    })

    it('should have token field configured correctly', () => {
      const tokenField = lskySettingSchema.items.find(item => item.field === 'token')
      expect(tokenField).toBeDefined()
      expect(tokenField?.type).toBe('text')
      expect(tokenField?.required).toBe(true)
    })

    it('should have strategies field as custom-selector', () => {
      const strategiesField = lskySettingSchema.items.find(item => item.field === 'strategies')
      expect(strategiesField).toBeDefined()
      expect(strategiesField?.type).toBe('custom-selector')
      expect(strategiesField?.customMethod).toBe('getStrategies')
      expect(strategiesField?.required).toBe(true)
    })

    it('should have permission related fields', () => {
      const fields = lskySettingSchema.items.map(item => item.field)
      expect(fields).toContain('useDefaultPermission')
      expect(fields).toContain('defaultPermission')
    })

    it('should have correct permission options', () => {
      const permissionField = lskySettingSchema.items.find(item => item.field === 'defaultPermission')
      expect(permissionField).toBeDefined()
      expect(permissionField?.options).toBeDefined()
      expect(permissionField?.options?.length).toBe(2)
      expect(permissionField?.options).toEqual([
        { label: '公开', value: 1 },
        { label: '私有', value: 0 },
      ])
    })
  })

  describe('getStrategies custom method', () => {
    it('should get strategies successfully', async () => {
      const mockStrategies = {
        status: true,
        message: 'Success',
        data: [
          { id: 1, name: 'Local Storage' },
          { id: 2, name: 'S3 Storage' },
        ],
      }

      vi.mocked(request).mockResolvedValue({
        data: mockStrategies,
        status: 200,
      })

      const getStrategies = lskySettingSchema.customMethods?.getStrategies
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
      const getStrategies = lskySettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await expect(
          getStrategies({ api: '', token: '' }),
        ).rejects.toThrow('请先配置API地址和Token')
      }
    })

    it('should handle API error response', async () => {
      vi.mocked(request).mockResolvedValue({
        data: {
          status: false,
          message: 'Unauthorized',
        },
        status: 401,
      })

      const getStrategies = lskySettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await expect(
          getStrategies({
            api: 'https://api.example.com',
            token: 'invalid-token',
          }),
        ).rejects.toThrow()
      }
    })

    it('should handle nested data structure', async () => {
      const mockResponse = {
        status: true,
        data: {
          data: [
            { id: 1, name: 'Strategy 1' },
            { id: 2, name: 'Strategy 2' },
          ],
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const getStrategies = lskySettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        const result = await getStrategies({
          api: 'https://api.example.com',
          token: 'test-token',
        })

        expect(result.length).toBe(2)
      }
    })

    it('should save strategies to pluginDataStore', async () => {
      const mockStrategies = {
        status: true,
        data: [
          { id: 1, name: 'Local Storage' },
        ],
      }

      vi.mocked(request).mockResolvedValue({
        data: mockStrategies,
        status: 200,
      })

      const getStrategies = lskySettingSchema.customMethods?.getStrategies

      if (getStrategies) {
        await getStrategies({
          api: 'https://api.example.com',
          token: 'test-token',
        })

        expect(pluginDataStore.setData).toHaveBeenCalledWith(
          'giopic-lsky',
          expect.any(String),
          mockStrategies.data,
        )
      }
    })
  })
})
