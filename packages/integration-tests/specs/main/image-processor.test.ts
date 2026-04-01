import { Buffer } from 'node:buffer'
import { sharpInstance } from 'sharp'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateThumbnail, getImageMetadata, isSharpAvailable } from '@/main/utils/image-processor'
import { mockLogger } from '@/main/utils/logger'

vi.mock('@/main/utils/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
  return { default: mockLogger, mockLogger }
})

vi.mock('sharp', () => {
  const sharpInstance = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('thumbnail data')),
    metadata: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      hasAlpha: false,
      orientation: 1,
    }),
  }
  return { default: vi.fn(() => sharpInstance), sharpInstance }
})

describe('image Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateThumbnail', () => {
    it('should return thumbnail data URI with sharp available', async () => {
      const buffer = new ArrayBuffer(1000)
      const result = await generateThumbnail(buffer, 200)
      expect(result.thumbnail).toMatch(/^data:image\/jpeg;base64,.+$/)
      expect(result.originalSize).toBe(1000)
      expect(result.thumbnailSize).toBeGreaterThan(0)
    })

    it('should return correct shape with originalSize and thumbnailSize', async () => {
      const buffer = new ArrayBuffer(5000)
      const result = await generateThumbnail(buffer)
      expect(result).toHaveProperty('thumbnail')
      expect(result).toHaveProperty('originalSize')
      expect(result).toHaveProperty('thumbnailSize')
      expect(typeof result.thumbnail).toBe('string')
      expect(typeof result.originalSize).toBe('number')
      expect(typeof result.thumbnailSize).toBe('number')
    })

    it('should use default maxSize of 200', async () => {
      const buffer = new ArrayBuffer(2000)
      await generateThumbnail(buffer)
      expect(sharpInstance.resize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'center',
      })
    })

    it('should use custom maxSize when provided', async () => {
      const buffer = new ArrayBuffer(2000)
      await generateThumbnail(buffer, 500)
      expect(sharpInstance.resize).toHaveBeenCalledWith(500, 500, {
        fit: 'cover',
        position: 'center',
      })
    })

    it('should convert to JPEG with quality 80', async () => {
      const buffer = new ArrayBuffer(1000)
      await generateThumbnail(buffer)
      expect(sharpInstance.jpeg).toHaveBeenCalledWith({ quality: 80 })
    })

    it('should include originalSize in result', async () => {
      const buffer = new ArrayBuffer(3500)
      const result = await generateThumbnail(buffer)
      expect(result.originalSize).toBe(3500)
    })

    it('should handle fallback when sharp processing fails', async () => {
      sharpInstance.toBuffer.mockRejectedValueOnce(new Error('Processing failed'))
      const buffer = new ArrayBuffer(2000)
      const result = await generateThumbnail(buffer)
      expect(result.thumbnail).toMatch(/^data:image\/jpeg;base64,.+$/)
      expect(result.thumbnailSize).toBe(2000)
    })

    it('should return original image as fallback', async () => {
      sharpInstance.toBuffer.mockRejectedValueOnce(new Error('Sharp error'))
      const buffer = new ArrayBuffer(1500)
      const result = await generateThumbnail(buffer)
      expect(result.thumbnail).toContain('base64,')
      expect(result.originalSize).toBe(1500)
    })

    it('should log error when sharp fails', async () => {
      const error = new Error('Processing error')
      sharpInstance.toBuffer.mockRejectedValueOnce(error)
      const buffer = new ArrayBuffer(1000)
      await generateThumbnail(buffer)
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ImageProcessor] Sharp处理失败，使用回退方案:',
        error,
      )
    })
  })

  describe('getImageMetadata', () => {
    it('should return full metadata with sharp available', async () => {
      const buffer = new ArrayBuffer(2000)
      const result = await getImageMetadata(buffer)
      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
      expect(result.format).toBe('jpeg')
      expect(result.hasAlpha).toBe(false)
      expect(result.orientation).toBe(1)
    })

    it('should always include size property', async () => {
      const buffer = new ArrayBuffer(4000)
      const result = await getImageMetadata(buffer)
      expect(result.size).toBe(4000)
    })

    it('should return metadata object with all properties', async () => {
      const buffer = new ArrayBuffer(3000)
      const result = await getImageMetadata(buffer)
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      expect(result).toHaveProperty('format')
      expect(result).toHaveProperty('size')
      expect(result).toHaveProperty('hasAlpha')
      expect(result).toHaveProperty('orientation')
    })

    it('should handle metadata retrieval with different buffer sizes', async () => {
      const buffer = new ArrayBuffer(5000)
      const result = await getImageMetadata(buffer)
      expect(result.size).toBe(5000)
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
    })

    it('should fall back to basic metadata on error', async () => {
      sharpInstance.metadata.mockRejectedValueOnce(new Error('Metadata error'))
      const buffer = new ArrayBuffer(2500)
      const result = await getImageMetadata(buffer)
      expect(result.size).toBe(2500)
      expect(result.width).toBeUndefined()
      expect(result.height).toBeUndefined()
    })

    it('should return basic metadata object when sharp fails', async () => {
      sharpInstance.metadata.mockRejectedValueOnce(new Error('Error'))
      const buffer = new ArrayBuffer(1000)
      const result = await getImageMetadata(buffer)
      expect(result).toHaveProperty('size')
      expect(result.size).toBe(1000)
    })

    it('should log error when metadata extraction fails', async () => {
      const error = new Error('Metadata extraction failed')
      sharpInstance.metadata.mockRejectedValueOnce(error)
      const buffer = new ArrayBuffer(2000)
      await getImageMetadata(buffer)
      expect(mockLogger.error).toHaveBeenCalledWith('[ImageProcessor] 获取元数据失败:', error)
    })

    it('should handle missing metadata properties gracefully', async () => {
      sharpInstance.metadata.mockResolvedValueOnce({
        width: 800,
        height: 600,
      })
      const buffer = new ArrayBuffer(1500)
      const result = await getImageMetadata(buffer)
      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(result.format).toBeUndefined()
      expect(result.size).toBe(1500)
    })
  })

  describe('isSharpAvailable', () => {
    it('should return true when sharp loads successfully', async () => {
      const result = await isSharpAvailable()
      expect(result).toBe(true)
    })

    it('should cache result after first call', async () => {
      const result1 = await isSharpAvailable()
      const result2 = await isSharpAvailable()
      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })
  })

  describe('integration tests', () => {
    it('should generate thumbnail and return proper data URI', async () => {
      const buffer = new ArrayBuffer(4000)
      const result = await generateThumbnail(buffer, 200)
      expect(result.thumbnail.startsWith('data:image/jpeg;base64,')).toBe(true)
      expect(result.originalSize).toBe(4000)
      expect(result.thumbnailSize).toBeGreaterThan(0)
    })

    it('should handle multiple consecutive calls', async () => {
      const buffer = new ArrayBuffer(1000)
      const result1 = await generateThumbnail(buffer)
      const result2 = await generateThumbnail(buffer)
      expect(result1.originalSize).toBe(1000)
      expect(result2.originalSize).toBe(1000)
    })

    it('should mix thumbnail and metadata calls', async () => {
      const buffer = new ArrayBuffer(3000)
      const thumbnail = await generateThumbnail(buffer, 150)
      const metadata = await getImageMetadata(buffer)
      expect(thumbnail.originalSize).toBe(3000)
      expect(metadata.size).toBe(3000)
      expect(metadata.width).toBe(1920)
    })
  })
})
