import type { PluginDataStore } from '@giopic/core'
import Store from 'electron-store'

const pluginDataStore = new Store({
  name: 'plugin-data',
  serialize: (data) => {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  },
  deserialize: (data: string) => {
    const parsed = JSON.parse(data)
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
  },
})

export function createMainPluginDataStoreAdapter(): PluginDataStore {
  return {
    setData: (pluginId: string, key: string, data: any): void => {
      const currentData = pluginDataStore.get('pluginData', {}) as Record<string, Record<string, any>>

      if (!currentData[pluginId]) {
        currentData[pluginId] = {}
      }
      currentData[pluginId][key] = data

      pluginDataStore.set('pluginData', currentData)
    },

    getData: (pluginId: string, key: string): any => {
      const currentData = pluginDataStore.get('pluginData', {}) as Record<string, Record<string, any>>
      return currentData[pluginId]?.[key]
    },

    removeData: (pluginId: string, key: string): void => {
      const currentData = pluginDataStore.get('pluginData', {}) as Record<string, Record<string, any>>

      if (currentData[pluginId]) {
        delete currentData[pluginId][key]
        pluginDataStore.set('pluginData', currentData)
      }
    },

    getAllData: (pluginId: string): Record<string, any> => {
      const currentData = pluginDataStore.get('pluginData', {}) as Record<string, Record<string, any>>
      return currentData[pluginId] || {}
    },
  }
}
