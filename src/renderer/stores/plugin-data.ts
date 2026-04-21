import type { PluginDataStore } from '@giopic/core'

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
      const programKey = `${programId}`

      Object.keys(pluginData.value).forEach((pluginId) => {
        const pluginDataObj = pluginData.value[pluginId]
        if (pluginDataObj) {
          Object.keys(pluginDataObj).forEach((key) => {
            if (key.startsWith(`${programKey}-`)) {
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
      const data = await window.ipcRenderer.invoke('get-all-plugin-data', pluginId)
      if (data && Object.keys(data).length > 0) {
        pluginData.value[pluginId] = data
      }
    }

    const syncToMain = (pluginId: string, key: string, data: any): void => {
      window.ipcRenderer.invoke('set-plugin-data', { pluginId, key, data }).catch((e) => {
        console.error(`同步数据到主进程失败: ${pluginId}.${key}`, e)
      })
    }

    const syncRemoveToMain = (pluginId: string, key: string): void => {
      window.ipcRenderer.invoke('remove-plugin-data', { pluginId, key }).catch((e) => {
        console.error(`同步删除数据到主进程失败: ${pluginId}.${key}`, e)
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
      syncRemoveToMain,
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
      store.syncRemoveToMain(pluginId, key)
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
