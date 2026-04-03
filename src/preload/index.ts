import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    return ipcRenderer.on(channel, listener)
  },
  off(channel: string, listener: (...args: any[]) => void) {
    return ipcRenderer.off(channel, listener)
  },
  send(channel: string, ...args: any[]) {
    return ipcRenderer.send(channel, ...args)
  },
  invoke(channel: string, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
  // 兼容旧代码的 callMain，内部使用原生 invoke
  callMain(channel: string, data?: any) {
    return ipcRenderer.invoke(channel, data)
  },
})

contextBridge.exposeInMainWorld('giopicRuntime', {
  e2e: process.env.GIOPIC_E2E === '1',
})
