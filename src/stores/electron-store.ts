const electronStore = {
  set: async (key: string, value: object) => {
    await window.ipcRenderer.invoke('set-store', key, JSON.stringify(value))
  },
  get: async (key: string): Promise<object> => {
    const strData = await electronStore.getStr(key)
    return strData ? JSON.parse(strData) : strData
  },
  getList: async (key: string): Promise<object[]> => {
    const strData = await electronStore.getStr(key)
    return strData ? JSON.parse(strData) : []
  },
  setStr: async (key: string, value: string) => {
    await window.ipcRenderer.invoke('set-store', key, value)
  },
  getStr: async (key: string): Promise<string> => {
    return await window.ipcRenderer.invoke('get-store', key)
  },
  delete: async (key: string): Promise<void> => {
    await window.ipcRenderer.invoke('delete-store', key)
  },
}

export default electronStore
