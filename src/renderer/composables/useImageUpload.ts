import pLimit from 'p-limit'

export interface UploadOptions {
  isAllPublic: Ref<number>
  defaultProgram: Ref<number | null>
}

export function useImageUpload(options: UploadOptions) {
  const { isAllPublic, defaultProgram } = options
  const programStore = useProgramStore()
  const uploadDataStore = useUploadDataStore()
  const { data } = storeToRefs(uploadDataStore)

  const isUpload = ref(false)

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  function extractBase64FromDataUrl(dataUrl: string): string {
    const base64Index = dataUrl.indexOf(',')
    return base64Index !== -1 ? dataUrl.substring(base64Index + 1) : dataUrl
  }

  function prepareUploadParams(item: any, fileName: string, fileBuffer: ArrayBuffer, base64Data: string) {
    const baseParams = {
      fileName,
      fileBuffer: Array.from(new Uint8Array(fileBuffer)),
      base64Data,
      mimetype: item.file?.type || 'image/jpeg',
      size: fileBuffer.byteLength,
    }

    return { ...baseParams, permission: isAllPublic.value }
  }

  // 获取文件数据
  async function getFileData(item: any) {
    let fileBuffer: ArrayBuffer
    let base64Data: string

    if (item.buffer) {
      fileBuffer = item.buffer
      base64Data = arrayBufferToBase64(fileBuffer)
    }
    else if (item.file) {
      fileBuffer = await item.file.arrayBuffer()
      base64Data = arrayBufferToBase64(fileBuffer)
    }
    else if (item.fileUrl) {
      base64Data = extractBase64FromDataUrl(item.fileUrl)
      const binaryString = atob(base64Data)
      fileBuffer = new ArrayBuffer(binaryString.length)
      const bytes = new Uint8Array(fileBuffer)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
    }
    else {
      throw new Error('图片文件数据无效，请重新选择文件')
    }

    return { fileBuffer, base64Data }
  }

  // 单个图片上传
  async function uploadSingleImage(index: number, shouldGetRecord = true) {
    if (!defaultProgram.value) {
      window.$message.error('请先选择存储程序后再上传')
      throw new Error('请先选择存储程序后再上传')
    }

    const item = data.value[index]
    if (!item) {
      window.$message.error('图片文件不存在')
      throw new Error('图片文件不存在')
    }

    if (item.uploaded) {
      return
    }

    if (!item.file && !item.buffer) {
      window.$message.error('图片文件数据无效，请重新选择')
      throw new Error('图片文件数据无效，请重新选择')
    }

    const program = programStore.getProgram(defaultProgram.value)
    if (!program || !program.id) {
      window.$message.error('请先选择存储程序')
      throw new Error('请先选择存储程序')
    }

    if (!program.pluginId) {
      window.$message.error('当前程序不支持，请使用插件')
      throw new Error('当前程序不支持，请使用插件')
    }

    const fileName = item.file?.name || 'unknown'
    const { fileBuffer, base64Data } = await getFileData(item)
    const params = prepareUploadParams(item, fileName, fileBuffer, base64Data)

    const completeParams: Record<string, any> = {
      ...JSON.parse(JSON.stringify(params)),
      ...JSON.parse(JSON.stringify(program.detail)),
      pluginId: program.pluginId,
    }

    uploadDataStore.setData({ isLoading: true }, index)

    try {
      const uploadResult = await window.ipcRenderer.invoke('upload-with-plugin', {
        pluginId: program.pluginId,
        params: completeParams,
      })

      uploadDataStore.setData(
        {
          ...uploadResult,
          uploadFailed: false,
          isLoading: false,
          time: new Date().toISOString(),
          uploaded: true,
          program_id: program.id || undefined,
          program_type: program.type,
        },
        index,
      )

      if (shouldGetRecord) {
        uploadDataStore.getUploadData()
      }
    }
    catch (error) {
      uploadDataStore.setData(
        {
          ...item,
          uploadFailed: true,
          uploaded: false,
          isLoading: false,
        },
        index,
      )
      throw error
    }
  }

  // 批量上传
  async function uploadBatchImages() {
    const uploadList = data.value.filter(item => !item.url && !item.uploadFailed && !item.uploaded)

    if (!uploadList.length) {
      window.$message.error('没有需要上传的图片')
      throw new Error('没有需要上传的图片')
    }

    isUpload.value = true

    const limit = pLimit(3)
    const errors: Error[] = []

    try {
      const tasks = uploadList.map((item) => {
        if (item.url || item.uploadFailed || item.uploaded) {
          return null
        }

        if (!item.file && !item.buffer) {
          const index = data.value.indexOf(item)
          const error = new Error(`图片 ${index + 1} 文件数据无效`)
          errors.push(error)
          return null
        }

        const originalIndex = data.value.indexOf(item)
        return limit(() => uploadSingleImage(originalIndex, false).catch((error) => {
          errors.push(error instanceof Error ? error : new Error(String(error)))
          return null
        }))
      }).filter(Boolean)

      if (tasks.length === 0) {
        if (errors.length > 0) {
          window.$message.error(`上传失败: ${errors[0].message}${errors.length > 1 ? ` 等${errors.length}个错误` : ''}`)
        }
        else {
          window.$message.error('没有有效的图片可上传')
        }
        throw new Error('没有有效的图片可上传')
      }

      await Promise.all(tasks)
      uploadDataStore.getUploadData()

      if (errors.length > 0) {
        window.$message.error(`部分图片上传失败: ${errors[0].message}${errors.length > 1 ? ` 等${errors.length}个错误` : ''}`)
      }
    }
    finally {
      isUpload.value = false
    }
  }

  return {
    isUpload: readonly(isUpload),
    uploadSingleImage,
    uploadBatchImages,
  }
}
