import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

export * from './modules/app'
export * from './modules/app/lsky'
export * from './modules/user'
export * from './modules/record'

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
