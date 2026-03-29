import type { Program } from '~/stores'
import { pluginApi } from './plugin'

function getCurrentProgram() {
  const appStore = useAppStore()
  const programStore = useProgramStore()
  const program = programStore.getProgram(appStore.defaultProgram)

  if (!program || !program.id) {
    throw new Error('请先选择存储程序')
  }

  return program
}

function getProgramAuthParams(program: Program): Record<string, any> {
  if (!program || !program.id) {
    throw new Error('请先选择存储程序')
  }

  if (!program.pluginId) {
    throw new Error('当前程序不支持，请使用插件')
  }

  return {
    ...program.detail,
    pluginId: program.pluginId,
  }
}

export const ipcApi = {
  async insertUploadData(dataString: string) {
    await callIpc('insert-upload-data', dataString)
    return true
  },

  async fetchUploadDataPaginated(page = 1, pageSize = 20) {
    return callIpc('fetch-upload-data-paginated', { page, pageSize })
  },

  async fetchAllUploadData() {
    return callIpc('fetch-all-upload-data')
  },

  async getUploadDataCount() {
    return callIpc('get-upload-data-count')
  },

  async getUploadTotalSize() {
    return callIpc('get-upload-total-size')
  },

  async deleteUploadData(key: string) {
    await callIpc('delete-upload-data', key)
    return true
  },

  async deleteUploadDataBatch(keys: string[]) {
    await callIpc('delete-upload-data-batch', keys)
    return true
  },

  // 图片处理
  async generateImageThumbnail(fileBuffer: ArrayBuffer, maxSize = 200) {
    return callIpc('generate-image-thumbnail', { fileBuffer, maxSize })
  },

  async getImageMetadata(fileBuffer: ArrayBuffer) {
    return callIpc('get-image-metadata', fileBuffer)
  },

  // 系统设置
  async setAutoStart(enabled: boolean) {
    await callIpc('auto-start', enabled)
    return true
  },

  async setDevTools(enabled: boolean) {
    await callIpc('reg-dev-tools', enabled)
    return true
  },

  async setDockIconVisible(visible: boolean) {
    await callIpc('dock-icon-show', visible)
    return true
  },

  async resetSettings() {
    await callIpc('reset-settings')
    return true
  },
}

export const apiClient = {
  upload: async (params: Record<string, any>) => {
    const program = getCurrentProgram()
    const authParams = getProgramAuthParams(program)

    const completeParams: Record<string, any> = {
      ...JSON.parse(JSON.stringify(params)),
      ...JSON.parse(JSON.stringify(authParams)),
    }

    completeParams.pluginId = program.pluginId

    const result = await pluginApi.uploadWithPlugin(program.pluginId, completeParams)
    return result
  },
}

export { pluginApi }
