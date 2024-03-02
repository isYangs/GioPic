import { defineStore } from 'pinia'
import requestData from '~/api'

interface State {
  api: string
  token: string
  strategies: []
  strategiesVal: number | null
}

interface StrategiesData {
  name: string
  id: number
}

export const useLskyStore = defineStore(
  'lskyStore',
  () => {
    const state: State = reactive({
      api: '',
      token: '',
      strategies: [],
      strategiesVal: null,
    })

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     */
    async function setState<T extends State>(newState: Partial<T>) {
      Object.assign(state, newState)
    }

    /**
     * 获取所有的存储策略
     */
    async function getStrategies(): Promise<boolean> {
      const { data, status } = await requestData.getLskyStrategies(state.api, state.token)

      if (status !== 200)
        return false

      const { strategies } = data.data

      const strategiesData = strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      setState({ strategies: strategiesData })

      if (state.strategiesVal === null && strategiesData.length > 0)
        setState({ strategiesVal: Number(strategiesData[0].value) })

      return true
    }

    return {
      ...toRefs(state),
      getStrategies,
    }
  },
  {
    persist: {
      key: '__giopic_lsky_store__',
      paths: ['api', 'token', 'strategies', 'strategiesVal'],
    },
  },
)
