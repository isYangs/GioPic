import { usePluginStore } from './plugin'

export interface Program {
  id: number | null
  type: string
  name: string
  detail: Record<string, any>
  pluginId: string
}

export const useProgramStore = defineStore(
  'programStore',
  () => {
    const programs = ref<Program[]>([])

    function createProgram(type: string) {
      const id = Date.now()
      programs.value.push({
        type,
        name: '',
        id,
        detail: {},
        pluginId: '',
      })
      return id
    }

    function setProgramDetail(id: number, detail: Record<string, any>) {
      const program = getProgram(id)
      // 使用响应式的方式更新 detail
      program.detail = { ...program.detail, ...detail }
    }

    function setProgramName(id: number, name: string) {
      getProgram(id).name = name
    }

    function getProgram(id: number | null): Program {
      const program = programs.value.find(item => item.id === id)
      if (!program) {
        return { type: 'unknown', name: '', id: null, detail: {}, pluginId: '' }
      }
      return program
    }

    function getProgramList() {
      const pluginStore = usePluginStore()
      return programs.value.map(item => ({
        label: item.name || pluginStore.getPluginNameByType(item.type),
        value: item.id,
        type: item.type,
      }))
    }

    function removeProgram(id: number) {
      const index = programs.value.findIndex(item => item.id === id)
      if (index !== -1)
        programs.value.splice(index, 1)
      return Math.max(index - 1, 0)
    }

    function getPluginSetting(programId: number, pluginId: string): Record<string, any> {
      const program = getProgram(programId)
      if (!program.detail[pluginId]) {
        program.detail[pluginId] = {}
      }
      return program.detail[pluginId]
    }

    return {
      programs,
      createProgram,
      setProgramDetail,
      setProgramName,
      getProgramList,
      getProgram,
      removeProgram,
      getPluginSetting,
    }
  },
  {
    persistedState: {
      key: '__giopic_program_store__',
      includePaths: ['programs'],
    },
  },
)
