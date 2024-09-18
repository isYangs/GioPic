import { defineStore } from 'pinia'
import type { ProgramsName } from '~/types'

interface State {
  appCloseType: 'close' | 'hide'
  appCloseTip: boolean
  autoStart: boolean
  autoUpdate: boolean
  isDevToolsOpen: boolean
  defaultPrograms: ProgramsName
  isMenuCollapsed: boolean

  themeAuto: boolean
  themeType: 'light' | 'dark' | null

  isImgListDelDialog: boolean
  isUploadRecordDelDialog: boolean
  lastCallTimes: { [key: string]: number }
}

export const useAppStore = defineStore(
  'appStore',
  () => {
    const state: State = reactive({
      // 基础
      appCloseType: 'hide', // 关闭类型 'close' | 'hide'
      appCloseTip: false, // 是否显示关闭应用对话框
      autoStart: false, // 是否开机自启动
      autoUpdate: false, // 是否自动更新
      isDevToolsOpen: true, // 是否打开开发者工具
      defaultPrograms: 'lskyPro', // 默认上传存储程序
      isMenuCollapsed: false, // 是否折叠菜单

      // 主题
      themeType: 'light', // 主题类型 'light' | 'dark'
      themeAuto: false, // 是否自动切换主题

      isImgListDelDialog: false, // 是否显示图片列表删除对话框
      isUploadRecordDelDialog: false, // 是否显示上传记录删除对话框
      lastCallTimes: {}, // 上次调用时间，用于限制函数调用频率
    })

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     */
    function setState<T extends State>(newState: Partial<T>) {
      Object.assign(state, newState)
    }

    return {
      ...toRefs(state),
      setState,
    }
  },
  {
    persist: {
      key: '__giopic_app_store__',
      omit: ['isMenuCollapsed','isImgListDelDialog', 'isUploadRecordDelDialog'],
    },
  },
)
