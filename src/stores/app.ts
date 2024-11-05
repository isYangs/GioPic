import type { ProgramsName } from '~/types'

const initialState = {
  // 基础
  appCloseType: 'hide' as 'close' | 'hide', // 关闭类型 'close' | 'hide'
  appCloseTip: false, // 是否显示关闭应用对话框
  autoStart: false, // 是否开机自启动
  autoUpdate: false, // 是否自动更新
  isDevToolsEnabled: true, // 是否打开开发者工具
  defaultPrograms: 'lskyPro' as ProgramsName, // 默认上传存储程序
  isMenuCollapsed: false, // 是否折叠菜单
  ignoreVersion: '', // 忽略更新的版本号
  updateAtNext: false, // 是否在下次启动时更新

  // 主题
  themeType: 'light' as 'light' | 'dark' | null, // 主题类型 'light' | 'dark' | null
  themeAuto: false, // 是否自动切换主题

  isImgListDelDialog: false, // 是否显示图片列表删除对话框
  isUploadRecordDelDialog: false, // 是否显示上传记录删除对话框
  lastCallTimes: {} as { [key: string]: number }, // 上次调用时间，用于限制函数调用频率
}

type State = typeof initialState

export const useAppStore = defineStore(
  'appStore',
  () => {
    const state: State = reactive(initialState)

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     */
    function setState<T extends State>(newState: Partial<T>) {
      Object.assign(state, newState)
    }

    /** 重置所有状态到初始值 */
    function resetState() {
      const copiedState = { ...initialState }
      Object.assign(state, copiedState)
    }

    return {
      ...toRefs(state),
      setState,
      resetState,
    }
  },
  {
    persistedState: {
      key: '__giopic_app_store__',
      excludePaths: ['isMenuCollapsed', 'isImgListDelDialog', 'isUploadRecordDelDialog'],
    },
  },
)
