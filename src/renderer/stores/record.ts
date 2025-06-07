import { ipcApi } from '~/api'

interface State {
  data: UploadData[]
}

// 扩展自上传器响应的文件数据
interface BaseData {
  key?: string
  name?: string
  origin_name?: string
  mimetype?: string
  size?: number
  time?: string
  program_id?: number
  program_type?: string
  url?: string
}

export interface UploadData extends BaseData {
  file?: File
  name?: string
  id?: string
  thumbnail?: string
  buffer?: ArrayBuffer
  fileUrl?: string
  metadata?: {
    width?: number
    height?: number
    format?: string
    size?: number
    hasAlpha?: boolean
    orientation?: number
  }
  isLoading?: boolean
  uploadFailed?: boolean
  uploaded?: boolean
  time?: string
  isPublic?: number
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
  async function getUploadData() {
    const promises = state.data
      .filter(item => item.url && item.key)
      .map(async ({ key, name, time, size, mimetype, url, origin_name, program_id, program_type }: UploadData) => {
        try {
          await ipcApi.insertUploadData(JSON.stringify({
            key,
            name,
            time,
            size,
            mimetype,
            url,
            origin_name,
            program_id,
            program_type,
          }))
        }
        catch (e) {
          console.error('Error inserting upload data:', e instanceof Error ? e.message : String(e))
        }
      })

    await Promise.all(promises)
  }

  return {
    ...toRefs(state),
    setData,
    delData,
    getUploadData,
  }
})
