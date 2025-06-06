export interface StoragePlugin {
  /** 插件唯一标识 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件作者 */
  author: string
  /** 插件描述 */
  description: string
  /** 插件图标 (可选) */
  icon?: string
  /** 存储程序类型 */
  type: string
  /** 是否内置插件 */
  isBuiltin?: boolean
  /** 插件本地路径 */
  path?: string
  /** NPM包名称 (用于内置插件) */
  npmPackage?: string
  /** 插件是否启用 */
  enabled?: boolean
}

export interface SettingItem {
  /** 字段名 */
  field: string
  /** 标签文本 */
  label: string
  /** 描述文本 */
  description?: string
  /** 控件类型 */
  type: 'text' | 'number' | 'select' | 'switch' | 'custom-selector'
  /** 占位符文本 */
  placeholder?: string
  /** 是否必填 */
  required?: boolean
  /** 选择项（用于select类型） */
  options?: Array<{ label: string, value: any }>
  /** 自定义方法名（用于custom-selector类型） */
  customMethod?: string
  /** 自定义原始数据的键名，默认为 ${field}Options */
  dataKey?: string
  /** 用于显示的字段名，默认为 'name' */
  labelField?: string
  /** 用于值的字段名，默认为 'id' */
  valueField?: string
  /** 显示格式模板，如 '{name} (ID: {id})'，默认为 '{name} (ID: {id})' */
  labelFormat?: string
  /** 是否多选 */
  multiple?: boolean
}

export interface SettingSchema {
  /** 设置项列表 */
  items: SettingItem[]
  /** 默认值 */
  defaultValues?: Record<string, any>
  /** 判断是否应该禁用权限选择的函数 */
  shouldDisablePermissionSelect?: (config: Record<string, any>) => boolean
  /** 自定义方法集合 */
  customMethods?: Record<string, (params: any) => Promise<any>>
}

export interface UploaderParams {
  /** 文件名 */
  fileName: string
  /** 文件 buffer 数据 */
  fileBuffer: number[]
  /** 文件 base64 数据 */
  base64Data: string
  /** 文件 MIME 类型 */
  mimetype: string
  /** 文件大小 */
  size: number
  /** 访问权限 */
  permission?: number
  /** 是否禁用权限选择 */
  disablePermissionSelect?: boolean
}

export interface UploaderResponse {
  /** 图片唯一密钥 */
  key: string | number
  /** 图片名称 */
  name: string
  /** 图片大小 */
  size: number
  /** 图片类型 */
  mimetype: string
  /** 图片url */
  url: string
  /** 图片原始名 */
  origin_name: string
}

export interface PluginDataStore {
  /** 保存插件数据 */
  setData: (pluginId: string, key: string, data: any) => void
  /** 获取插件数据 */
  getData: (pluginId: string, key: string) => any
  /** 删除插件数据 */
  removeData: (pluginId: string, key: string) => void
  /** 获取插件的所有数据 */
  getAllData: (pluginId: string) => Record<string, any>
}
