import { lskyproSettingSchema } from './config'
import { createUploader } from './uploader'

const pluginConfig = {
  name: 'lskypro-plugin',
  description: '兰空企业版v2插件',
  settingSchema: lskyproSettingSchema,
  createUploader,
}

export * from './types'
export { createUploader } from './uploader'
export default pluginConfig
