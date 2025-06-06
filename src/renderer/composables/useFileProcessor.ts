import { ipcApi } from '~/api'

export interface FileProcessorOptions {
  onProcessStart?: () => void
  onProcessEnd?: () => void
  onSuccess?: (count: number) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
}

export function useFileProcessor(options: FileProcessorOptions = {}) {
  const {
    onProcessStart,
    onProcessEnd,
    onSuccess,
    onError,
    onWarning,
  } = options

  const imageExtensions = /\.(?:jpg|jpeg|png|gif|bmp|webp|svg|tiff|tif|ico|avif|heic|heif|raw|cr2|nef|orf|sr2|dng|arw|rwl|pef|x3f|erf|mef|mrw|nrw|ptx|pxn|r3d|raf|srw|crw|dcr|kdc|mdc|mos)$/i

  function isValidImageFile(file: File): boolean {
    return file.type?.startsWith('image/') || imageExtensions.test(file.name)
  }

  function generateFileId(filename: string): string {
    return `${filename}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async function processFileInMainProcess(file: File): Promise<{
    buffer: ArrayBuffer
    thumbnail: string
    metadata?: any
  }> {
    try {
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })

      const [thumbnailResult, metadataResult] = await Promise.all([
        ipcApi.generateImageThumbnail(buffer, 200),
        ipcApi.getImageMetadata(buffer),
      ])

      return {
        buffer,
        thumbnail: thumbnailResult.thumbnail,
        metadata: metadataResult || null,
      }
    }
    catch (e) {
      console.error('主进程文件处理失败，回退到渲染进程处理:', e)
      return await readFileContentFallback(file)
    }
  }

  async function readFileContentFallback(file: File): Promise<{
    buffer: ArrayBuffer
    thumbnail: string
    metadata?: any
  }> {
    try {
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })

      const url = URL.createObjectURL(file)
      const img = new Image()

      const thumbnail = await new Promise<string>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          const maxSize = 200

          let { width, height } = img
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          }
          else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
          URL.revokeObjectURL(url)
        }
        img.onerror = () => {
          resolve('')
          URL.revokeObjectURL(url)
        }
      })

      img.src = url

      return {
        buffer,
        thumbnail,
        metadata: {
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: file.type.split('/')[1] || 'unknown',
          size: file.size,
        },
      }
    }
    catch {
      throw new Error('文件处理失败')
    }
  }

  async function processFiles(files: File[] | FileList | null, uploadDataStore: any): Promise<void> {
    if (!files)
      return

    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(isValidImageFile)
    const rejectedCount = fileArray.length - imageFiles.length

    if (imageFiles.length === 0) {
      onWarning?.('未找到有效的图片文件')
      return
    }

    if (rejectedCount > 0) {
      onWarning?.(`已过滤掉 ${rejectedCount} 个非图片文件`)
    }

    onProcessStart?.()

    try {
      const concurrencyLimit = 3
      const batches = []

      for (let i = 0; i < imageFiles.length; i += concurrencyLimit) {
        const batch = imageFiles.slice(i, i + concurrencyLimit)
        batches.push(batch)
      }

      let processedCount = 0

      for (const batch of batches) {
        const batchPromises = batch.map(async (file) => {
          try {
            const { buffer, thumbnail, metadata } = await processFileInMainProcess(file)

            return uploadDataStore.setData({
              file,
              id: generateFileId(file.name),
              name: file.name,
              thumbnail,
              buffer,
              metadata,
              isLoading: false,
            })
          }
          catch (error) {
            console.error(`处理文件 ${file.name} 失败:`, error)
            throw error
          }
        })

        await Promise.all(batchPromises)
        processedCount += batch.length

        await new Promise(resolve => setTimeout(resolve, 10))
      }

      onSuccess?.(processedCount)
    }
    catch (e) {
      console.error('文件处理失败:', e)
      onError?.('文件处理时出现错误')
    }
    finally {
      onProcessEnd?.()
    }
  }

  return {
    isValidImageFile,
    generateFileId,
    processFileInMainProcess,
    processFiles,
  }
}
