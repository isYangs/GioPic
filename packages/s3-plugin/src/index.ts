import { s3SettingSchema } from './config'
import { createUploader } from './uploader'

const pluginConfig = {
  name: 's3-plugin',
  description: 'S3 存储插件',
  settingSchema: s3SettingSchema,
  createUploader,
}

export * from './types'
export { createUploader } from './uploader'
export default pluginConfig
