import { createPinia } from 'pinia'
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2'

export * from './app'
export * from './programs'
export * from './record'

const store = createPinia()

async function setStore(key: string, value: string) {
  await window.ipcRenderer.invoke('set-store', key, value)
}

async function getStore(key: string): Promise<string> {
  return await window.ipcRenderer.invoke('get-store', key)
}

async function deleteStore(key: string): Promise<void> {
  await window.ipcRenderer.invoke('delete-store', key)
}

store.use(
  createPersistedStatePlugin({
    storage: {
      setItem(key, value) {
        return setStore(key, value)
      },
      getItem(key) {
        return getStore(key)
      },
      removeItem(key) {
        return deleteStore(key)
      },
    },
  }),
)
export default store
