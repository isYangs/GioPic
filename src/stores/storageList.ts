import { defineStore } from 'pinia'
import requestData from '~/api'
import type { StorageListName } from '~/types'

interface State {
  storageList: Storage[]
}

interface Storage {
  id: StorageListName
  name: string
  api: string
  token: string
  strategies: []
  strategiesVal: number | null
}

interface StrategiesData {
  name: string
  id: number
}

export const useStorageListStore = defineStore(
  'storageListStore',
  () => {
    const state: State = reactive({
      storageList: [],
    })

    /**
     * 设置状态对象的值
     */
    async function setState<T extends State>(newState: Partial<T>) {
      Object.assign(state, newState)
    }

    /**
     * 获取所有的存储策略
     */
    async function getStrategies(type: StorageListName): Promise<boolean> {
      const isLsky = type === 'lsky'

      const storageIndex = state.storageList.findIndex(item => item.id === type)

      if (storageIndex === -1) {
        window.$message.error(`No storage found with id: ${type}`)
        return false
      }

      const storage = state.storageList[storageIndex]

      const requestDataFunction = isLsky ? requestData.getLskyStrategies : requestData.getLskyProStrategies
      const { data, status } = await requestDataFunction(storage.api, storage.token)

      if (status !== 200)
        return false

      const { strategies } = data.data

      const strategiesData = strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      state.storageList[storageIndex].strategies = strategiesData

      if (state.storageList[storageIndex].strategiesVal === null && strategiesData.length > 0)
        state.storageList[storageIndex].strategiesVal = Number(strategiesData[0].value)

      return true
    }

    return {
      ...toRefs(state),
      setState,
      getStrategies,
    }
  },
  {
    persist: {
      key: '__giopic_storage_list_store__',
      paths: ['storageList'],
    },
  },
)
