import { defineStore } from 'pinia'
import requestData from '~/api'
import type { StorageListName } from '~/types'

interface State {
  selectStorageVal: StorageListName
  storageListMenu: { name: string, id: StorageListName, settingOptions: [] }[]

  lskyApi: string
  lskyToken: string
  lskyStrategies: []
  lskyStrategiesVal: number | null

  lskyProApi: string
  lskyProToken: string
  lskyProStrategies: []
  lskyProStrategiesVal: number | null
}

interface StrategiesData {
  name: string
  id: number
}

export const useStorageListStore = defineStore(
  'storageListStore',
  () => {
    const state: State = reactive({
      selectStorageVal: 'lskyPro',
      storageListMenu: [],

      // 兰空图床
      lskyApi: '',
      lskyToken: '',
      lskyStrategies: [],
      lskyStrategiesVal: null,

      // 兰空图床企业版
      lskyProApi: '',
      lskyProToken: '',
      lskyProStrategies: [],
      lskyProStrategiesVal: null,
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
    async function getLskyStrategies(api: string, token: string): Promise<boolean> {
      const isLsky = state.selectStorageVal === 'lsky'

      const requestDataFunction = isLsky ? requestData.getLskyStrategies : requestData.getLskyProStrategies
      const { data, status } = await requestDataFunction(api, token)

      if (status !== 200)
        return false

      const { strategies } = data.data

      const strategiesData = strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      const strategiesKey = isLsky ? 'lskyStrategies' : 'lskyProStrategies'
      const strategiesValKey = isLsky ? 'lskyStrategiesVal' : 'lskyProStrategiesVal'

      console.log(strategiesKey, strategiesValKey)

      setState({ [strategiesKey]: strategiesData })

      if (state[strategiesValKey] === null && strategiesData.length > 0)
        setState({ [strategiesValKey]: Number(strategiesData[0].value) })

      return true
    }

    return {
      ...toRefs(state),
      setState,
      getLskyStrategies,
    }
  },
  {
    persist: {
      key: '__giopic_storage_list_store__',
      paths: ['selectStorageVal', 'strategiesVal', 'storageListMenu', 'lskyProApi', 'lskyProToken', 'lskyProStrategies', 'lskyProStrategiesVal'],
    },
  },
)
