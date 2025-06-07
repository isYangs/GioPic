import type { PluginDataStore } from '@giopic/core'
import { pluginApi } from '~/api'

export const usePluginDataStore = defineStore(
  'pluginDataStore',
  () => {
    const pluginData = ref<Record<string, Record<string, any>>>({})

    const setData = (pluginId: string, key: string, data: any): void => {
      if (!pluginData.value[pluginId]) {
        pluginData.value[pluginId] = {}
      }
      pluginData.value[pluginId][key] = data
    }

    const getData = (pluginId: string, key: string): any => {
      return pluginData.value[pluginId]?.[key]
    }

    const removeData = (pluginId: string, key: string): void => {
      if (pluginData.value[pluginId]) {
        delete pluginData.value[pluginId][key]
      }
    }

    const getAllData = (pluginId: string): Record<string, any> => {
      return pluginData.value[pluginId] || {}
    }

    const removeProgramData = (programId: number): void => {
      const programKey = `program-${programId}`

      Object.keys(pluginData.value).forEach((pluginId) => {
        const pluginDataObj = pluginData.value[pluginId]
        if (pluginDataObj) {
          Object.keys(pluginDataObj).forEach((key) => {
            if (key.startsWith(programKey)) {
              delete pluginDataObj[key]
              console.warn(`删除插件数据: ${pluginId}.${key}`)
            }
          })

          if (Object.keys(pluginDataObj).length === 0) {
            delete pluginData.value[pluginId]
          }
        }
      })
    }

    const syncFromMain = async (pluginId: string): Promise<void> => {
      try {
        const data = await pluginApi.getAllPluginData(pluginId)
        if (data && Object.keys(data).length > 0) {
          pluginData.value[pluginId] = data
        }
      }
      catch (e) {
        console.error(`同步插件数据失败: ${pluginId}`, e)
      }
    }

    const syncToMain = (pluginId: string, key: string, data: any): void => {
      pluginApi.setPluginData(pluginId, key, data).catch((e) => {
        console.error(`同步数据到主进程失败: ${pluginId}.${key}`, e)
      })
    }

    return {
      pluginData,
      setData,
      getData,
      removeData,
      getAllData,
      removeProgramData,
      syncFromMain,
      syncToMain,
    }
  },
  {
    persistedState: {
      key: '__giopic_plugin_data_store__',
    },
  },
)

export function createPluginDataStoreAdapter(): PluginDataStore {
  const store = usePluginDataStore()

  return {
    setData: (pluginId: string, key: string, data: any): void => {
      store.setData(pluginId, key, data)
      store.syncToMain(pluginId, key, data)
    },

    getData: (pluginId: string, key: string): any => {
      return store.getData(pluginId, key)
    },

    removeData: (pluginId: string, key: string): void => {
      store.removeData(pluginId, key)
    },

    getAllData: (pluginId: string): Record<string, any> => {
      return store.getAllData(pluginId)
    },
  }
}

export async function syncPluginDataFromMain(pluginId: string): Promise<void> {
  const store = usePluginDataStore()
  await store.syncFromMain(pluginId)
}
