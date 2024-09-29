import { createPinia } from 'pinia'
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2'
import electronStore from './electron-store'

export * from './app'
export * from './programs'
export * from './record'

const store = createPinia()

store.use(
  createPersistedStatePlugin({
    storage: {
      setItem(key, value) {
        return electronStore.setStr(key, value)
      },
      getItem(key) {
        return electronStore.getStr(key)
      },
      removeItem(key) {
        return electronStore.delete(key)
      },
    },
  }),
)
export default store
