import { defineStore } from 'pinia'

interface State {
  selectStorageValue: 'Lsky' | 'LskyPro'
}

export const useStepStore = defineStore('stepStore', () => {
  const state: State = reactive({
    selectStorageValue: 'LskyPro',
  })

  return {
    ...toRefs(state),
  }
})
