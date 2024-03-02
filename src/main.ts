import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router/auto'
import 'animate.css'
import App from './App.vue'
import store from './stores'
import './style/main.css'
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
})

app
  .use(store)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    // Remove Preload scripts loading
    postMessage({ payload: 'removeLoading' }, '*')

    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_e, message) => {
      console.log(message)
    })
  })
