import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

export * from './app'
export * from './storageList'
export * from './record'

const store = createPinia()
store.use(
  createPersistedState({
    serializer: {
      deserialize: JSON.parse,
      serialize: JSON.stringify,
    },
  }),
)
export default store
