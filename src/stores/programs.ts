import requestData from '~/api'
import type { ProgramType } from '~/types'

type StorageType = typeof initialProgramMap

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
const initialProgramMap = {
  lsky: {
    api: '' as string,
    token: '' as string,
    strategies: [] as [],
    strategiesVal: null as (number | null),
  },
}

export const useProgramsStore = defineStore(
  'programsStore',
  () => {
    const state = reactive({
      programs: [],
    })

    function createProgram(type: ProgramType) {

    }

    function setPrograms<K extends keyof Storage>(id: ProgramType, key: K, value: Storage[K]) {
      if (state.programs[id])
        state.programs[id][key] = value
    }

    function getPrograms(id: ProgramType) {
      return state.programs[id] || {}
    }

    /**
     * 获取所有的存储策略
     */
    async function getStrategies(id: ProgramType): Promise<boolean> {
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
