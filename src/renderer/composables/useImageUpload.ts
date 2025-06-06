import pLimit from 'p-limit'
import { apiClient } from '~/api'
import { useProgramStore, useUploadDataStore } from '~/stores'

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
      throw new Error('无法获取文件数据')
    }

    return { fileBuffer, base64Data }
  }

  // 单个图片上传
  async function uploadSingleImage(index: number, shouldGetRecord = true) {
    if (!defaultProgram.value) {
      window.$message.error('请选择存储程序后再上传')
      return
    }

    const item = data.value[index]
    if (!item) {
      window.$message.error('文件数据不存在')
      return
    }

    if (item.uploaded) {
      window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
      return
    }

    if (!item.file && !item.buffer) {
      window.$message.error('文件数据无效，无法上传')
      return
    }

    uploadDataStore.setData({ isLoading: true }, index)

    try {
      const program = programStore.getProgram(defaultProgram.value)
      const fileName = item.file?.name || 'unknown'

      const { fileBuffer, base64Data } = await getFileData(item)
      const params = prepareUploadParams(item, fileName, fileBuffer, base64Data)

      const res = await apiClient.upload(params)

      uploadDataStore.setData(
        {
          ...res,
          uploadFailed: false,
          time: new Date().toISOString(),
          uploaded: true,
          program_id: program.id,
          program_type: program.type,
        },
        index,
      )
      window.$message.success('上传成功')
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '上传失败'
      console.error('上传失败:', e)
      window.$message.error(errorMessage)
      uploadDataStore.setData({ uploadFailed: true }, index)
    }
    finally {
      uploadDataStore.setData({ isLoading: false }, index)
      if (shouldGetRecord)
        uploadDataStore.getUploadData()
    }
  }

  // 批量上传
  async function uploadBatchImages() {
    isUpload.value = true

    await nextTick()

    try {
      const uploadList = data.value.filter(item => !item.url && !item.uploadFailed && !item.uploaded)

      if (!uploadList.length) {
        window.$message.info('没有需要上传的图片')
        isUpload.value = false
        return
      }

      const limit = pLimit(3)
      const uploadingTasks = new Set()

      const tasks = uploadList.map((item) => {
        if (item.url || item.uploadFailed || item.uploaded) {
          return null
        }

        if (!item.file && !item.buffer) {
          const index = data.value.indexOf(item)
          window.$message.error(`图片 ${index + 1} 文件数据无效，无法上传。`)
          return null
        }

        const originalIndex = data.value.indexOf(item)

        const task = limit(() =>
          uploadSingleImage(originalIndex, false)
            .then(() => {
              uploadingTasks.delete(task)
              if (uploadingTasks.size === 0) {
                isUpload.value = false
                uploadDataStore.getUploadData()
              }
            })
            .catch((e) => {
              const errorMessage = e instanceof Error ? e.message : '上传失败'
              console.error(`图片 ${originalIndex + 1} 上传失败:`, errorMessage)
              window.$message.error(`图片 ${originalIndex + 1} 上传失败: ${errorMessage}`)
            }),
        )

        uploadingTasks.add(task)
        return task
      }).filter(Boolean)

      if (tasks.length === 0) {
        isUpload.value = false
        return
      }

      await Promise.all(tasks)
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '批量上传过程中发生错误'
      console.error('批量上传过程中发生错误:', errorMessage)
    }
    finally {
      isUpload.value = false
      uploadDataStore.getUploadData()
    }
  }

  return {
    isUpload: readonly(isUpload),
    uploadSingleImage,
    uploadBatchImages,
  }
}
