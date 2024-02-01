import { useAppStore } from '~/stores'
// import { SelectGroupOption, SelectOption } from 'naive-ui';

/**
 * 检查应用程序的配置。
 *
 * 这个函数首先获取 appStore 的 apiUrl 和 token。
 * 如果 apiUrl 和 token 都为空，那么它会显示一个警告对话框，提示用户程序还没有配置。
 *
 * 对话框有两个按钮：'前往配置'和'取消'。
 * 如果用户点击'前往配置'，那么会打开配置抽屉（通过设置 appStore 的 isSettingsDrawer 为 true）。
 * 如果用户点击'取消'，或者关闭对话框，那么程序会退出（通过发送 'quit-app' 事件给 ipcRenderer）。
 */
export const checkConfiguration = () => {
  const appStore = useAppStore()
  const dialog = useDialog()
  const { apiUrl, token } = appStore
  if (apiUrl === '' && token === '') {
    dialog.warning({
      title: '提示',
      content: '检测到程序还没有配置，是否前往配置？',
      positiveText: '前往配置',
      negativeText: '取消',
      closeOnEsc: false,
      maskClosable: false,
      autoFocus: false,
      onPositiveClick: () => {
        appStore.setState({ isSettingsDrawer: true })
      },
      onClose: () => {
        window.ipcRenderer.send('quit-app')
      },
      onNegativeClick: () => {
        window.ipcRenderer.send('quit-app')
      },
    })
  } else {
    appStore.getUserProfile()
  }
}

export interface ImgLinkFormatTabsOption {
  label: string
  value: string
  lang?: string
}

/**
 * 图片链接格式数组，每个元素包含一个标签和一个值。
 * 标签是原始格式名称，值是格式名称的小写版本，并用下划线替换了空格。
 *
 * @example
 * // 返回值示例：
 * [
 *   { label: 'URL', value: 'url' },
 *   { label: 'HTML', value: 'html' },
 *   // ...
 * ]
 */
const imgLinkFormats = ['URL', 'HTML', 'BBCode', 'Markdown', 'Markdown With Link', 'Thumbnail URL']

export const getImgLinkFormat: ImgLinkFormatTabsOption[] = imgLinkFormats.map((format) => ({
  label: format,
  value: format.toLowerCase().replace(/\s+/g, '_'),
}))

/**
 * 获取图片链接格式选项卡。
 *
 * 这个函数会根据应用的状态（appStore）中的 imgLinkFormatVal 值来生成一个 ImgLinkFormatTabsOption[] 数组。
 * 每个选项卡的语言（lang）会根据其值（value）来确定。如果值包含 'html'，则语言为 'html'；
 * 如果值包含 'markdown'，则语言为 'markdown'；否则，语言为 'text'。
 */
export const getImgLinkFormatTabs = (): ImgLinkFormatTabsOption[] => {
  const appStore = useAppStore()
  const { imgLinkFormatVal } = appStore

  const formatMap = new Map(getImgLinkFormat.map((format) => [format.value, format]))

  const imgLinkFormatTabs = imgLinkFormatVal
    .map((item) => {
      const format = formatMap.get(item)
      if (format) {
        if (item.includes('html')) {
          format.lang = 'html'
        } else if (item.includes('markdown')) {
          format.lang = 'markdown'
        } else {
          format.lang = 'text'
        }
      }
      return format
    })
    .filter(Boolean) as ImgLinkFormatTabsOption[]

  return imgLinkFormatTabs
}
