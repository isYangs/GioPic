import { createApp } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import store from './stores'
import 'animate.css'
import './style/main.css'
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'

const app = createApp(App)

const router = createRouter({
  history: import.meta.env.DEV ? createWebHistory(import.meta.env.BASE_URL) : createWebHashHistory(),
  routes,
})

app
  .use(store)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    setTimeout(() => {
      window.ipcRenderer.send('win-loaded')
    }, 3000)
  })
