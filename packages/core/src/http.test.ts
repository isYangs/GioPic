import { request } from '@pkg-core/http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAxiosInstance, mockAxiosCreate, mockRequestInterceptorUse, mockResponseInterceptorUse } = vi.hoisted(() => {
  const instance = vi.fn()
  const mockRequestInterceptorUse = vi.fn()
  const mockResponseInterceptorUse = vi.fn()
  instance.interceptors = {
    request: { use: mockRequestInterceptorUse },
    response: { use: mockResponseInterceptorUse },
  }

  return {
    mockAxiosInstance: instance,
    mockAxiosCreate: vi.fn(() => instance),
    mockRequestInterceptorUse,
    mockResponseInterceptorUse,
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
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('axios interceptors', () => {
    it('should register request error handler in rejected slot', async () => {
      expect(mockRequestInterceptorUse).toHaveBeenCalledWith(undefined, expect.any(Function))

      const onRejected = mockRequestInterceptorUse.mock.calls[0]?.[1]
      const error = {
        config: {
          method: 'post',
          url: 'https://api.example.com/request-error',
        },
        message: 'Request interceptor failed',
      }

      await expect(onRejected?.(error)).rejects.toBe(error)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[request] Failed - Method: post, URL: https://api.example.com/request-error, Error: Request interceptor failed'),
      )
    })

    it('should register response error handler in rejected slot', async () => {
      expect(mockResponseInterceptorUse).toHaveBeenCalledWith(undefined, expect.any(Function))

      const onRejected = mockResponseInterceptorUse.mock.calls[0]?.[1]
      const error = {
        config: {
          method: 'get',
          url: 'https://api.example.com/response-error',
        },
        response: {
          status: 500,
        },
        message: 'Response interceptor failed',
      }

      await expect(onRejected?.(error)).rejects.toBe(error)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[response] Failed - Method: get, URL: https://api.example.com/response-error, Status: 500, Error: Response interceptor failed'),
      )
    })
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
