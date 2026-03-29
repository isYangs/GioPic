import { request } from '@giopic/core'
import { createUploader } from '@pkg-lsky/uploader'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@giopic/core', async () => {
  const actual = await vi.importActual('@giopic/core')
  return {
    ...actual,
    request: vi.fn(),
    createFormData: () => {
      const FormDataMock = class {
        private data: Map<string, any> = new Map()
        append(key: string, value: any, _options?: any) {
          this.data.set(key, value)
        }

        getHeaders() {
          return { 'content-type': 'multipart/form-data' }
        }
      }
      return new FormDataMock()
    },
  }
})

describe('lsky-plugin uploader', () => {
  const mockFileBuffer = Array.from({ length: 1024 }, () => 0)
  const mockBase64Data = 'data:image/jpeg;base64,ZmFrZQ=='

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUploader', () => {
    it('should create uploader with upload method', () => {
      const uploader = createUploader()
      expect(uploader).toBeDefined()
      expect(uploader.upload).toBeInstanceOf(Function)
    })
  })

  describe('upload', () => {
    it('should upload file successfully to single strategy', async () => {
      const mockResponse = {
        status: true,
        message: 'Success',
        data: {
          key: 'test-key',
          name: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          origin_name: 'test.jpg',
          links: {
            url: 'https://example.com/test.jpg',
          },
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const uploader = createUploader()
      const result = await uploader.upload({
        api: 'https://api.example.com',
        token: 'test-token',
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        strategies: '1',
      })

      expect(result).toBeDefined()
      if (!Array.isArray(result)) {
        expect(result.url).toBe('https://example.com/test.jpg')
        expect(result.name).toBe('test.jpg')
      }
    })

    it('should upload file to multiple strategies', async () => {
      const mockResponse = {
        status: true,
        message: 'Success',
        data: {
          key: 'test-key',
          name: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          origin_name: 'test.jpg',
          links: {
            url: 'https://example.com/test.jpg',
          },
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const uploader = createUploader()
      const result = await uploader.upload({
        api: 'https://api.example.com',
        token: 'test-token',
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        strategies: [1, 2],
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      if (Array.isArray(result)) {
        expect(result.length).toBe(2)
      }
    })

    it('should handle upload failure', async () => {
      vi.mocked(request).mockResolvedValue({
        data: {
          status: false,
          message: 'Upload failed',
        },
        status: 400,
      })

      const uploader = createUploader()

      await expect(
        uploader.upload({
          api: 'https://api.example.com',
          token: 'test-token',
          fileName: 'test.jpg',
          fileBuffer: mockFileBuffer,
          base64Data: mockBase64Data,
          mimetype: 'image/jpeg',
          size: 1024,
          strategies: '1',
        }),
      ).rejects.toThrow('Upload failed')
    })

    it('should use default permission when enabled', async () => {
      const mockResponse = {
        status: true,
        data: {
          key: 'test-key',
          name: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          origin_name: 'test.jpg',
          links: {
            url: 'https://example.com/test.jpg',
          },
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const uploader = createUploader()
      await uploader.upload({
        api: 'https://api.example.com',
        token: 'test-token',
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        strategies: '1',
        useDefaultPermission: true,
        defaultPermission: 0,
      })

      expect(request).toHaveBeenCalled()
    })

    it('should parse strategy string with commas', async () => {
      const mockResponse = {
        status: true,
        data: {
          key: 'test-key',
          name: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          origin_name: 'test.jpg',
          links: {
            url: 'https://example.com/test.jpg',
          },
        },
      }

      vi.mocked(request).mockResolvedValue({
        data: mockResponse,
        status: 200,
      })

      const uploader = createUploader()
      const result = await uploader.upload({
        api: 'https://api.example.com',
        token: 'test-token',
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        strategies: '1,2,3',
      })

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle missing URL in response', async () => {
      vi.mocked(request).mockResolvedValue({
        data: {
          status: true,
          data: {
            key: 'test-key',
            name: 'test.jpg',
            links: {},
          },
        },
        status: 200,
      })

      const uploader = createUploader()

      await expect(
        uploader.upload({
          api: 'https://api.example.com',
          token: 'test-token',
          fileName: 'test.jpg',
          fileBuffer: mockFileBuffer,
          base64Data: mockBase64Data,
          mimetype: 'image/jpeg',
          size: 1024,
          strategies: '1',
        }),
      ).rejects.toThrow()
    })

    it('should handle partial success in multiple strategies', async () => {
      let callCount = 0
      vi.mocked(request).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            data: {
              status: true,
              data: {
                key: 'test-key',
                name: 'test.jpg',
                size: 1024,
                mimetype: 'image/jpeg',
                origin_name: 'test.jpg',
                links: {
                  url: 'https://example.com/test.jpg',
                },
              },
            },
            status: 200,
          }
        }
        else {
          return {
            data: {
              status: false,
              message: 'Strategy 2 failed',
            },
            status: 400,
          }
        }
      })

      const uploader = createUploader()
      const result = await uploader.upload({
        api: 'https://api.example.com',
        token: 'test-token',
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        strategies: [1, 2],
      })

      expect(result).toBeDefined()
      if (!Array.isArray(result)) {
        expect(result.url).toBe('https://example.com/test.jpg')
      }
    })
  })
})
