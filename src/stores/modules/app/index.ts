import { defineStore } from 'pinia'
import type { SelectGroupOption, SelectOption } from 'naive-ui'

interface State {
  appCloseType: 'close' | 'hide'
  isMenuCollapsed: boolean
  appCloseTip: boolean
  themeType: 'light' | 'dark' | null
  themeAuto: boolean
  isSettingsDrawer: boolean
  isUploadRecord: boolean
  strategies: (SelectOption | SelectGroupOption)[]
  strategiesVal: number | null
  imgLinkFormatVal: string[]
  isImgListDelDialog: boolean
  isUploadRecordDelDialog: boolean
  recordSavePath: string
  lastCallTimes: { [key: string]: number }
}

export const useAppStore = defineStore(
  'appStore',
  () => {
    const state: State = reactive({
      // 基础
      appCloseType: 'hide', // 关闭类型 'close' | 'hide'
      appCloseTip: false, // 是否显示关闭应用对话框
      isMenuCollapsed: false, // 是否折叠菜单
      imgLinkFormatVal: ['url', 'html', 'markdown', 'bbcode'], // 图片链接格式

      // 系统
      recordSavePath: '', // 记录文件存储的路径

      // 主题
      themeType: 'light', // 主题类型 'light' | 'dark'
      themeAuto: false, // 是否自动切换主题

      isSettingsDrawer: false, // 是否显示设置面板
      isUploadRecord: false, // 是否显示上传记录面板
      strategies: [], // 存储策略
      strategiesVal: null, // 存储策略
      isImgListDelDialog: false, // 是否显示图片列表删除对话框
      isUploadRecordDelDialog: false, // 是否显示上传记录删除对话框
      lastCallTimes: {}, // 上次调用时间，用于限制函数调用频率
    })

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     */
    async function setState<T extends State>(newState: Partial<T>) {
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
      paths: [
        'appCloseType',
        'appCloseTip',
        'recordSavePath',
        'themeType',
        'themeAuto',
        'imgLinkFormatVal',
        'lastCallTimes',
      ],
    },
  },
)
