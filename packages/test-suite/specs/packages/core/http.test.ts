import { request } from '@pkg-core/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAxiosInstance, mockAxiosCreate } = vi.hoisted(() => {
  const instance = vi.fn()
  instance.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }

  return {
    mockAxiosInstance: instance,
    mockAxiosCreate: vi.fn(() => instance),
  }
})

vi.mock('axios', () => {
  return {
    default: {
      create: mockAxiosCreate,
    },
  }
})

describe('http', () => {
  beforeEach(() => {
    mockAxiosCreate.mockClear()
    mockAxiosInstance.mockReset()
  })

  describe('request', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = {
        data: { success: true, message: 'test' },
        status: 200,
        headers: { 'content-type': 'application/json' },
      }

      mockAxiosInstance.mockResolvedValue(mockResponse)

      const result = await request({
        url: 'https://api.example.com/test',
        method: 'GET',
      })

      expect(result.status).toBe(200)
      expect(result.data).toEqual({ success: true, message: 'test' })
    })

    it('should make a POST request with data', async () => {
      const mockResponse = {
        data: { id: 1, name: 'created' },
        status: 201,
        headers: {},
      }

      mockAxiosInstance.mockResolvedValue(mockResponse)

      const result = await request({
        url: 'https://api.example.com/create',
        method: 'POST',
        data: { name: 'test' },
      })

      expect(result.status).toBe(201)
      expect(result.data).toEqual({ id: 1, name: 'created' })
    })

    it('should handle custom headers', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      }

      mockAxiosInstance.mockResolvedValue(mockResponse)

      await request({
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value',
        },
      })

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'value',
          }),
        }),
      )
    })

    it('should handle timeout option', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      }

      mockAxiosInstance.mockResolvedValue(mockResponse)

      await request({
        url: 'https://api.example.com/test',
        method: 'GET',
        timeout: 5000,
      })

      expect(mockAxiosInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        }),
      )
    })

    it('should handle request errors', async () => {
      const mockError = new Error('Network error')
      mockAxiosInstance.mockRejectedValue(mockError)

      await expect(
        request({
          url: 'https://api.example.com/test',
          method: 'GET',
        }),
      ).rejects.toThrow('Network error')
    })
  })
})
