import type { PluginDataStore } from './types'

let globalPluginDataStore: PluginDataStore | null = null

export function setPluginDataStore(store: PluginDataStore): void {
  globalPluginDataStore = store
}

export function getPluginDataStore(): PluginDataStore {
  if (!globalPluginDataStore) {
    throw new Error('PluginDataStore not initialized. Please call setPluginDataStore first.')
  }
  return globalPluginDataStore
}

export const pluginDataStore = {
  setData: (pluginId: string, key: string, data: any) =>
    getPluginDataStore().setData(pluginId, key, data),
  getData: (pluginId: string, key: string) =>
    getPluginDataStore().getData(pluginId, key),
  removeData: (pluginId: string, key: string) =>
    getPluginDataStore().removeData(pluginId, key),
  getAllData: (pluginId: string) =>
    getPluginDataStore().getAllData(pluginId),
}
