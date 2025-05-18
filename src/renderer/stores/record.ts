import type { UploadFileInfo } from 'naive-ui'

interface State {
  data: UploadData[]
}

// 接口返回的文件数据
interface BaseData {
  name?: string
  key?: string
  size?: number
  mimetype?: string
  url?: string
  origin_name?: string
}

export interface UploadData extends BaseData {
  fileUrl?: string // 文件的blob地址，用于预览
  fileInfo?: UploadFileInfo // 文件信息
  isLoading?: boolean // 是否正在上传
  uploadFailed?: boolean // 是否上传失败
  uploaded?: boolean // 是否上传成功
  time?: string // 上传时间
  isPublic?: number // 是否公开
  strategies?: number // 上传策略
}

export const useUploadDataStore = defineStore('uploadDataStore', () => {
  const state: State = reactive({
    data: [],
  })

  /**
   * 当前文件列表中的数据。
   *
   * 如果提供了 `index` 参数，那么就会给指定的索引设置数据
   *
   * @param data - 要更新或添加的数据。
   * @param index - 要更新的项的索引。如果没有提供，那么会在数组的末尾添加新的项。
   */
  function setData(data: UploadData, index?: number) {
    if (!data || Object.keys(data).length === 0)
      return

    if (index !== undefined)
      state.data[index] = { ...state.data[index], ...data }
    else
      state.data.push(data)
  }

  /**
   * 删除指定索引的数据，或清空所有数据。
   *
   * @param index - 要删除的数据的索引。如果未提供，将清空所有数据。
   */
  function delData(index?: number) {
    if (index !== undefined)
      state.data.splice(index, 1)
    else
      state.data = []
  }

  /**
   * 获取记录并发送到主进程以创建上传记录文件。
   */
  function getUploadData() {
    state.data
      .filter(item => item.url && item.key)
      .forEach(({ key, name, time, size, mimetype, url, origin_name }: UploadData) => {
        try {
          window.ipcRenderer.invoke('insert-upload-data', JSON.stringify({
            key,
            name,
            time,
            size,
            mimetype,
            url,
            origin_name,
          }))
        }
        catch (e) {
          console.error('Error inserting upload data:', e)
        }
      })
  }

  return {
    ...toRefs(state),
    setData,
    delData,
    getUploadData,
  }
}, {
  persistedState: {
    persist: false,
  },
})
