import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

export * from './app'
export * from './storageApp'
export * from './record'
export * from './step'

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
