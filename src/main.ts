import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router/auto'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.min.css'
import 'animate.css'
import App from './App.vue'
import store from './stores'
import './style/main.css'
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'

const app = createApp(App)

app.directive('highlight', {
  mounted(el) {
    const blocks = el.querySelectorAll('pre code')
    blocks.forEach((block: Element) => {
      hljs.highlightElement(block as HTMLElement)
    })
  },
  updated(el) {
    const blocks = el.querySelectorAll('pre code')
    blocks.forEach((block: Element) => {
      hljs.highlightElement(block as HTMLElement)
    })
  },
})

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
