import { ipcMain } from 'electron'
import Store from 'electron-store'

export function initStore() {
  const store: Record<string, any> = new Store()

  ipcMain.handle('get-store', (_event, key) => {
    return store.get(key)
  })

  ipcMain.handle('set-store', (_event, key, value) => {
    store.set(key, value)
  })

  ipcMain.handle('delete-store', (_event, key) => {
    store.delete(key)
  })

  return store
}
