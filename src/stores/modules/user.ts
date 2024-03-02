import { defineStore } from 'pinia'
import { computed } from 'vue'
import { convertFileSize } from '~/utils'

export interface State {
  name: string | null
  capacity: number
  size: number
  imageNum: number
}
/**
 * user store module.
 */
export const useUserStore = defineStore(
  'userStore',
  () => {
    const state: State = reactive({
      name: null, // 昵称
      capacity: 0, // 总容量
      size: 0, // 已使用容量
      imageNum: 0, // 图片数量
    })

    /**
     * 计算属性 getCacpacity，它将 state.capacity（以KB为单位）转换为更易于理解的单位（KB，MB或GB）
     */
    const getCacpacity = computed(() => convertFileSize(state.capacity, true))

    /**
     * 计算属性 getSize，它将 state.size（以KB为单位）转换为更易于理解的单位（KB，MB或GB）。
     */
    const getSize = computed(() => convertFileSize(state.size, true))

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     * @example
     * setState({ name: '某某图床' });
     * userStore.setState({ name: '某某图床' });
     */
    function setState<T extends State>(newState: Partial<T>) {
      Object.assign(state, newState)
    }

    return { ...toRefs(state), getCacpacity, getSize, setState }
  },
  {
    persist: {
      key: 'USER_PROFILE',
      paths: ['name', 'capacity', 'size', 'imageNum'],
    },
  },
)
