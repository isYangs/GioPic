import { defineStore } from 'pinia'

export const useLskyStore = defineStore('lskyStore', () => {
  const state = reactive({})

  return {
    ...toRefs(state),
  }
}, {
  persist: {
    key: '__giopic_lsky_store__',
    paths: [''],
  },
})
