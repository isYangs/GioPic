import { lskySettingSchema } from './config'
import { createUploader } from './uploader'

const pluginConfig = {
  name: 'lsky-plugin',
  description: '兰空插件，同时支持社区版和企业版v1',
  settingSchema: lskySettingSchema,
  createUploader,
}

export * from './types'
export { createUploader } from './uploader'
export default pluginConfig
