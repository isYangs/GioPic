export function useFileProcessor() {
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
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })

    try {
      const [thumbnailResult, metadataResult] = await Promise.all([
        window.ipcRenderer.invoke('generate-image-thumbnail', { fileBuffer: buffer, maxSize: 200 }),
        window.ipcRenderer.invoke('get-image-metadata', buffer),
      ])

      return {
        buffer,
        thumbnail: thumbnailResult.thumbnail,
        metadata: metadataResult || null,
      }
    }
    catch {
      return await readFileContentFallback(file, buffer)
    }
  }

  async function readFileContentFallback(file: File, buffer: ArrayBuffer): Promise<{
    buffer: ArrayBuffer
    thumbnail: string
    metadata?: any
  }> {
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

  async function processFiles(files: File[] | FileList | null, uploadDataStore: any): Promise<number> {
    if (!files) {
      throw new Error('未提供文件')
    }

    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(isValidImageFile)
    const rejectedCount = fileArray.length - imageFiles.length

    if (imageFiles.length === 0) {
      throw new Error('未找到有效的图片文件')
    }

    if (rejectedCount > 0) {
      console.warn(`已过滤掉 ${rejectedCount} 个非图片文件`)
    }

    const concurrencyLimit = 3
    const batches = []

    for (let i = 0; i < imageFiles.length; i += concurrencyLimit) {
      const batch = imageFiles.slice(i, i + concurrencyLimit)
      batches.push(batch)
    }

    let processedCount = 0

    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        const { buffer, thumbnail, metadata } = await processFileInMainProcess(file)

        uploadDataStore.setData({
          file,
          id: generateFileId(file.name),
          name: file.name,
          thumbnail,
          buffer,
          metadata,
          isLoading: false,
        })
      })

      await Promise.all(batchPromises)
      processedCount += batch.length

      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return processedCount
  }

  return {
    isValidImageFile,
    generateFileId,
    processFileInMainProcess,
    processFiles,
  }
}
