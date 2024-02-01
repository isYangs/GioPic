import { defineStore } from 'pinia'
import type { SelectGroupOption, SelectOption } from 'naive-ui'
import { useUserStore } from './user'
import requestData from '~/api'
import type { ImgLinkFormatTabsOption } from '~/components/SettingsPanel/utils'

interface State {
  bgImgUrl: string
  isSettingsDrawer: boolean
  isUploadRecord: boolean
  apiUrl: string
  token: string
  apiUrlTitle: string
  strategies: (SelectOption | SelectGroupOption)[]
  strategiesVal: number | null
  imgLinkFormatVal: string[]
  imgLinkFormatTabs: ImgLinkFormatTabsOption[]
  isImgListDelDialog: boolean
  isUploadRecordDelDialog: boolean
  recordSavePath: string
  lastCallTime: number
}

interface StrategiesData {
  name: string
  id: number
}

export const useAppStore = defineStore(
  'appStore',
  () => {
    const state: State = reactive({
      bgImgUrl: '', // 背景图片地址
      isSettingsDrawer: false, // 是否显示设置面板
      isUploadRecord: false, // 是否显示上传记录面板
      apiUrl: '', // API地址
      token: '', // Token
      apiUrlTitle: '未知图床', // API地址网站标题
      strategies: [], // 存储策略
      strategiesVal: null, // 存储策略
      imgLinkFormatVal: ['url', 'html', 'markdown', 'bbcode'], // 图片链接格式
      imgLinkFormatTabs: [], // 显示的图片链接格式标签
      isImgListDelDialog: false, // 是否显示图片列表删除对话框
      isUploadRecordDelDialog: false, // 是否显示上传记录删除对话框
      recordSavePath: '', // 日志文件存储的路径
      lastCallTime: 0, // 上次调用时间，用于限制函数调用频率
    })

    /**
     * 设置状态对象的值
     * @template T - State 的子类型
     * @param {Partial<T>} newState - 包含要设置的新状态的对象。这个对象的键应该是 State 的键，值的类型应该与 State 中对应键的类型匹配
     * @example
     * setState({ bgImgUrl: 'https://xxx.com/xxx.jpg' });
     * appStore.setState({ bgImgUrl: 'https://xxx.com/xxx.jpg' });
     */
    async function setState<T extends State>(newState: Partial<T>) {
      if (newState.apiUrl && newState.apiUrl.endsWith('/'))
        newState.apiUrl = newState.apiUrl.split('/').slice(0, -1).join('/')

      Object.assign(state, newState)
    }
    /**
     * 获取API地址网站的标题
     */
    async function getApiUrlTitle(): Promise<boolean> {
      const { data, status } = await requestData.getApiUrlTitle(state.apiUrl)

      if (status !== 200)
        return false

      const doc = new DOMParser().parseFromString(data, 'text/html')
      const title
        = doc.querySelector('title')?.textContent?.split('-')?.[0]
        || doc.querySelector('title')?.textContent?.split(' ')?.[0]
        || '未知图床'
      setState({ apiUrlTitle: title })

      return true
    }

    /**
     * 获取用户信息
     */
    async function getUserProfile(): Promise<boolean> {
      const { data, status } = await requestData.getUserProfile(state.apiUrl, state.token)

      if (status !== 200)
        return false

      const { name, capacity, size, image_num } = data.data
      const userStore = useUserStore()
      userStore.setState({
        name,
        capacity,
        size,
        imageNum: image_num,
      })

      return true
    }

    /**
     * 获取所有的存储策略
     */
    async function getStrategies(): Promise<boolean> {
      const { data, status } = await requestData.getStrategies(state.apiUrl, state.token)

      if (status !== 200)
        return false

      const { strategies } = data.data

      const strategiesData = strategies.map((item: StrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      setState({ strategies: strategiesData })

      if (state.strategiesVal === null)
        setState({ strategiesVal: Number(state.strategies[0].value) })

      return true
    }

    return {
      ...toRefs(state),
      setState,
      getUserProfile,
      getApiUrlTitle,
      getStrategies,
    }
  },
  {
    persist: {
      key: 'APP_SETTING',
      paths: [
        'bgImgUrl',
        'isSettingsDrawer',
        'apiUrl',
        'token',
        'apiUrlTitle',
        'strategies',
        'strategiesVal',
        'imgLinkFormatVal',
        'imgLinkFormatTabs',
        'recordSavePath',
        'lastCallTime',
        'isImgListDelDialog',
        'isUploadRecordDelDialog',
      ],
    },
  },
)
