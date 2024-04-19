import { defineStore } from 'pinia'
import requestData from '~/api'

interface State {
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

export const useStorageAppStore = defineStore(
  'storageAppStore',
  () => {
    const state: State = reactive({
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
    async function getLskyProStrategies(): Promise<boolean> {
      const { data, status } = await requestData.getLskyProStrategies(state.lskyProApi, state.lskyProToken)
      if (status !== 200)
        return false

      const { strategies } = data.data

      const strategiesData = strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      setState({ lskyProStrategies: strategiesData })

      if (state.lskyProStrategiesVal === null && strategiesData.length > 0)
        setState({ lskyProStrategiesVal: Number(strategiesData[0].value) })

      return true
    }

    return {
      ...toRefs(state),
      getLskyProStrategies,
    }
  },
  {
    persist: {
      key: '__giopic_lsky_store__',
      paths: ['api', 'token', 'strategies', 'strategiesVal'],
    },
  },
)
