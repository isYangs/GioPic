import { defineStore } from 'pinia'
import type { FileInfo } from 'naive-ui/es/upload/src/interface'
import { useAppStore } from '~/stores'

interface State {
  data: UploadData[]
}

// 上传的文件数据，与接口返回的数据相同
interface BaseData {
  key?: string
  name?: string
  pathname?: string
  origin_name?: string
  size?: number
  mimetype?: string
  extension?: string
  md5?: string
  sha1?: string
  links?: {
    [key: string]: string
  }
}

export interface UploadData extends BaseData {
  fileUrl?: string // 文件的blob地址，用于预览
  fileInfo?: FileInfo // 文件信息
  isLoading?: boolean // 是否正在上传
  uploadFailed?: boolean // 是否上传失败
  time?: string // 上传时间
  isPublic?: number // 是否公开
  strategies?: number // 上传策略
}

export interface RecordData extends BaseData {
  id: string
  time: string
  isPublic: boolean
  strategies: number
}

export const useUploadRecordStore = defineStore('recordStore', () => {
  const state: State = reactive({
    data: [], // 上传的文件数组对象（在FileInfo中包含File对象）
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
  function getRecord() {
    const appStore = useAppStore()
    const { recordSavePath } = storeToRefs(appStore)
    state.data
      .filter(item => item.links && item.key)
      .forEach((item: UploadData) => {
        const { key = '', time = '', isPublic = false, strategies = 0, ...rest } = item
        const obj: RecordData = { id: key, time, isPublic: Boolean(isPublic), strategies, ...rest }
        const newLog = JSON.stringify(obj)
        window.ipcRenderer.send('create-ur-file', newLog, recordSavePath.value)
      })
  }
  return {
    ...toRefs(state),
    setData,
    delData,
    getRecord,
  }
})
