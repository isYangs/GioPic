import { usePluginStore } from './plugin'
import { usePluginDataStore } from './plugin-data'

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
      if (index !== -1) {
        const pluginDataStore = usePluginDataStore()
        pluginDataStore.removeProgramData(id)

        programs.value.splice(index, 1)
      }
      return Math.max(index - 1, 0)
    }

    function removeProgramsByPluginId(pluginId: string) {
      const removedPrograms = programs.value.filter(program => program.pluginId === pluginId)
      const pluginDataStore = usePluginDataStore()

      removedPrograms.forEach((program) => {
        if (program.id !== null) {
          pluginDataStore.removeProgramData(program.id)
        }
      })

      programs.value = programs.value.filter(program => program.pluginId !== pluginId)
      return removedPrograms
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
      removeProgramsByPluginId,
      getPluginSetting,
    }
  },
  {
    persistedState: {
      key: '__giopic_program_store__',
    },
  },
)
