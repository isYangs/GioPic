import requestData from '~/api'
import type { ProgramsName } from '~/types'

type Storage = typeof initialPrograms

interface State {
  programs: {
    [id: string]: Storage
  }
}

interface StrategiesData {
  name: string
  id: number
}

// 同时定义 State 类型和初始值
const initialPrograms = {
  api: '' as string,
  token: '' as string,
  strategies: [] as [],
  strategiesVal: null as (number | null),
}

export const useProgramsStore = defineStore(
  'programsStore',
  () => {
    const state: State = reactive({
      programs: {
        lskyPro: {
          ...initialPrograms,
        },
        lsky: {
          ...initialPrograms,
        },
      },
    })

    function setPrograms<K extends keyof Storage>(id: ProgramsName, key: K, value: Storage[K]) {
      if (state.programs[id])
        state.programs[id][key] = value
    }

    function getPrograms(id: ProgramsName) {
      return state.programs[id] || {}
    }

    /**
     * 获取所有的存储策略
     */
    async function getStrategies(id: ProgramsName): Promise<boolean> {
      const program = state.programs[id]

      const requestDataFunction = id === 'lsky' ? requestData.getLskyStrategies : requestData.getLskyProStrategies
      const { data, status } = await requestDataFunction(program.api, program.token)

      if (status !== 200)
        return false

      const strategiesData = data.data.strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      program.strategies = strategiesData

      if (program.strategiesVal === null && strategiesData.length > 0)
        program.strategiesVal = strategiesData[0].value

      return true
    }

    return {
      ...toRefs(state),
      setPrograms,
      getPrograms,
      getStrategies,
    }
  },
  {
    persistedState: {
      key: '__giopic_programs_store__',
      includePaths: ['programs'],
    },
  },
)
