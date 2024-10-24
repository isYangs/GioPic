import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store()
const defaultStoreKey = '__giopic_app_store__'
export function initStore() {
  ipcMain.handle('get-store', (_event, key) => {
    return store.get(key)
  })

  ipcMain.handle('set-store', (_event, key, value) => {
    store.set(key, value)
  })

  ipcMain.handle('delete-store', (_event, key) => {
    store.delete(key)
  })
}

export function getStore(key: string, storeKey: string = defaultStoreKey) {
  try {
    return JSON.parse(store.get(storeKey) as string)[key]
  }
  catch (e) {
    console.error(e)
    return key
  }
}

export function setStore(key: string, value: any, storeKey: string = defaultStoreKey) {
  try {
    const data = JSON.parse(store.get(storeKey) as string)
    data[key] = value
    store.set(storeKey, JSON.stringify(data))
  }
  catch (e) {
    console.error(e)
  }
}

export function clearStore() {
  store.clear()
}
