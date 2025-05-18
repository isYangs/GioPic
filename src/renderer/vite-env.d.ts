/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
}
