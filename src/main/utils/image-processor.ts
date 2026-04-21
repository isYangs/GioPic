import { Buffer } from 'node:buffer'
import logger from './logger'

interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size: number
  hasAlpha?: boolean
  orientation?: number
}

interface ThumbnailResult {
  thumbnail: string
  originalSize: number
  thumbnailSize: number
}

let sharp: any = null
let sharpAvailable: boolean | null = null

async function initSharp(): Promise<boolean> {
  if (sharpAvailable !== null) {
    return sharpAvailable
  }

  try {
    sharp = await import('sharp')
    sharp = sharp.default || sharp
    sharpAvailable = true
    logger.info('[ImageProcessor] Sharp库加载成功')
    return true
  }
  catch (error) {
    sharpAvailable = false
    logger.warn('[ImageProcessor] Sharp库不可用，将使用回退方案:', error instanceof Error ? error.message : String(error))
    return false
  }
}

export async function generateThumbnail(
  fileBuffer: ArrayBuffer,
  maxSize: number = 200,
): Promise<ThumbnailResult> {
  const buffer = Buffer.from(fileBuffer)
  const originalSize = fileBuffer.byteLength

  // 尝试使用Sharp处理
  if (await initSharp()) {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(maxSize, maxSize, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnail = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`

      return {
        thumbnail,
        originalSize,
        thumbnailSize: thumbnailBuffer.length,
      }
    }
    catch (error) {
      logger.error('[ImageProcessor] Sharp处理失败，使用回退方案:', error)
    }
  }

  // 回退返回原图的base64
  const thumbnail = `data:image/jpeg;base64,${buffer.toString('base64')}`
  return {
    thumbnail,
    originalSize,
    thumbnailSize: originalSize,
  }
}

export async function getImageMetadata(fileBuffer: ArrayBuffer): Promise<ImageMetadata> {
  const buffer = Buffer.from(fileBuffer)
  const basicMetadata: ImageMetadata = {
    size: fileBuffer.byteLength,
  }

  if (await initSharp()) {
    try {
      const metadata = await sharp(buffer).metadata()

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: fileBuffer.byteLength,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
      }
    }
    catch (error) {
      logger.error('[ImageProcessor] 获取元数据失败:', error)
    }
  }

  return basicMetadata
}

export async function isSharpAvailable(): Promise<boolean> {
  return await initSharp()
}

export type { ImageMetadata, ThumbnailResult }
