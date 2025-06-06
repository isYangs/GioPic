import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store({
  serialize: (data) => {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  },
  deserialize: (data: string) => {
    const parsed = JSON.parse(data)
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
  },
})

const defaultStoreKey = '__giopic_app_store__'

export function initStore() {
  ipcMain.handle('get-store', (_event, key) => {
    return store.get(key)
  })

  ipcMain.handle('set-store', (_event, key, value) => {
    const valueToStore = typeof value === 'string' ? JSON.parse(value) : value
    store.set(key, valueToStore)
  })

  ipcMain.handle('delete-store', (_event, key) => {
    store.delete(key)
  })
}

export function getStore(key: string, storeKey: string = defaultStoreKey) {
  try {
    const data = store.get(storeKey)
    return data?.[key]
  }
  catch (e) {
    console.error(e)
    return key
  }
}

export function setStore(key: string, value: any, storeKey: string = defaultStoreKey) {
  try {
    const data = store.get(storeKey) || {}
    data[key] = value
    store.set(storeKey, data)
  }
  catch (e) {
    console.error(e)
  }
}

export function clearStore() {
  store.clear()
}
