/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface Window {
  ipcRenderer: {
    on(channel: string, listener: (...args: any[]) => void): void
    off(channel: string, listener: (...args: any[]) => void): void
    send(channel: string, ...args: any[]): void
    invoke(channel: string, ...args: any[]): Promise<any>
    callMain(channel: string, data?: any): Promise<any>
  }
}
