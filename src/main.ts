import { createApp } from 'vue';
import './style/main.css';
import 'virtual:uno.css';
import '@unocss/reset/tailwind-compat.css';
import App from './App.vue';
import store from './store';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.min.css';

const app = createApp(App);

app.directive('highlight', {
    mounted(el) {
        const blocks = el.querySelectorAll('pre code');
        blocks.forEach((block: Element) => {
            hljs.highlightElement(block as HTMLElement);
        });
    },
    updated(el) {
        const blocks = el.querySelectorAll('pre code');
        blocks.forEach((block: Element) => {
            hljs.highlightElement(block as HTMLElement);
        });
    },
});

app.use(store)
    .mount('#app')
    .$nextTick(() => {
        // Remove Preload scripts loading
        postMessage({ payload: 'removeLoading' }, '*');

        // Use contextBridge
        window.ipcRenderer.on('main-process-message', (_event, message) => {
            console.log(message);
        });
    });
