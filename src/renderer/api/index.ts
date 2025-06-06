import type { Program } from '~/stores'
import { useAppStore, useProgramStore } from '~/stores'
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
    const res = await window.ipcRenderer.invoke('insert-upload-data', dataString)
    if (!res.success) {
      throw new Error(res.message || '插入上传数据失败')
    }
    return res.success
  },

  async fetchUploadDataPaginated(page = 1, pageSize = 20) {
    const res = await window.ipcRenderer.invoke('fetch-upload-data-paginated', page, pageSize)
    if (!res.success) {
      throw new Error(res.message || '获取分页上传数据失败')
    }
    return res.data
  },

  async fetchAllUploadData() {
    const res = await window.ipcRenderer.invoke('fetch-all-upload-data')
    if (!res.success) {
      throw new Error(res.message || '获取所有上传数据失败')
    }
    return res.data
  },

  async getUploadDataCount() {
    const res = await window.ipcRenderer.invoke('get-upload-data-count')
    if (!res.success) {
      throw new Error(res.message || '获取上传数据数量失败')
    }
    return res.data
  },

  async getUploadTotalSize() {
    const res = await window.ipcRenderer.invoke('get-upload-total-size')
    if (!res.success) {
      throw new Error(res.message || '获取上传数据总大小失败')
    }
    return res.data
  },

  async deleteUploadData(key: string) {
    const res = await window.ipcRenderer.invoke('delete-upload-data', key)
    if (!res.success) {
      throw new Error(res.message || '删除上传数据失败')
    }
    return true
  },

  async deleteUploadDataBatch(keys: string[]) {
    const res = await window.ipcRenderer.invoke('delete-upload-data-batch', keys)
    if (!res.success) {
      throw new Error(res.message || '批量删除上传数据失败')
    }
    return true
  },

  // 图片处理
  async generateImageThumbnail(fileBuffer: ArrayBuffer, maxSize = 200) {
    const res = await window.ipcRenderer.invoke('generate-image-thumbnail', fileBuffer, maxSize)
    if (!res.success) {
      throw new Error(res.message || '生成缩略图失败')
    }
    return res.data
  },

  async getImageMetadata(fileBuffer: ArrayBuffer) {
    const res = await window.ipcRenderer.invoke('get-image-metadata', fileBuffer)
    if (!res.success) {
      throw new Error(res.message || '获取图片元数据失败')
    }
    return res.data
  },

  // 系统设置
  async setAutoStart(enabled: boolean) {
    const res = await window.ipcRenderer.invoke('auto-start', enabled)
    if (!res.success) {
      throw new Error(res.message || '设置开机自启失败')
    }
    return true
  },

  async setDevTools(enabled: boolean) {
    const res = await window.ipcRenderer.invoke('reg-dev-tools', enabled)
    if (!res.success) {
      throw new Error(res.message || '设置开发者工具快捷键失败')
    }
    return true
  },

  async setDockIconVisible(visible: boolean) {
    const res = await window.ipcRenderer.invoke('dock-icon-show', visible)
    if (!res.success) {
      throw new Error(res.message || '设置任务栏图标失败')
    }
    return true
  },

  async resetSettings() {
    const res = await window.ipcRenderer.invoke('reset-settings')
    if (!res.success) {
      throw new Error(res.message || '重置设置失败')
    }
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
