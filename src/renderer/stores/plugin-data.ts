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

    // 从主进程同步数据（异步）
    const syncFromMain = async (pluginId: string): Promise<void> => {
      try {
        const data = await pluginApi.getAllPluginData(pluginId)
        if (data && Object.keys(data).length > 0) {
          pluginData.value[pluginId] = data
        }
      }
      catch (e) {
        console.warn(`同步插件数据失败: ${pluginId}`, e)
      }
    }

    // 后台同步到主进程（不阻塞）
    const syncToMain = (pluginId: string, key: string, data: any): void => {
      pluginApi.setPluginData(pluginId, key, data).catch((e) => {
        console.warn(`同步数据到主进程失败: ${pluginId}.${key}`, e)
      })
    }

    return {
      pluginData,
      setData,
      getData,
      removeData,
      getAllData,
      syncFromMain,
      syncToMain,
    }
  },
  {
    persistedState: {
      key: '__giopic_plugin_data_store__',
      includePaths: ['pluginData'],
    },
  },
)

// 创建适配器，将 pinia store 适配为 PluginDataStore 接口
export function createPluginDataStoreAdapter(): PluginDataStore {
  const store = usePluginDataStore()

  return {
    setData: (pluginId: string, key: string, data: any): void => {
      // 保存到本地 store
      store.setData(pluginId, key, data)

      // 后台同步到主进程（不阻塞）
      store.syncToMain(pluginId, key, data)
    },

    getData: (pluginId: string, key: string): any => {
      // 从本地获取（如果需要从主进程获取，需要手动调用 syncFromMain）
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

// 手动同步数据的辅助函数
export async function syncPluginDataFromMain(pluginId: string): Promise<void> {
  const store = usePluginDataStore()
  await store.syncFromMain(pluginId)
}
