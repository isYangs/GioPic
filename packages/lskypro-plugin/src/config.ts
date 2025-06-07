import type { SettingSchema } from '@giopic/core'
import { pluginDataStore, request } from '@giopic/core'

async function getStrategies(params: { api: string, token: string, programId?: number }) {
  if (!params.api || !params.token) {
    throw new Error('请先配置API地址和Token')
  }

  try {
    const { data: res } = await request({
      url: `${params.api}/api/v2/group`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
      },
    })

    if (res.status !== 'success') {
      throw new Error(res.message || '获取存储策略失败')
    }

    const strategies = res.data?.storages
    if (!Array.isArray(strategies)) {
      throw new TypeError('API返回的存储策略数据格式不正确')
    }

    if (!Array.isArray(strategies)) {
      throw new TypeError('API返回的数据格式不正确')
    }

    const options = strategies.map((strategy: any) => ({
      label: `${strategy.name} (ID: ${strategy.id})`,
      value: strategy.id,
    }))

    const dataKey = params.programId
      ? `program-${params.programId}`
      : `api-${params.api.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}`

    pluginDataStore.setData('giopic-lskypro', `${dataKey}-strategiesOptions`, strategies)

    return options
  }
  catch (error) {
    throw new Error(error instanceof Error ? error.message : '获取存储策略失败')
  }
}

export const lskyproSettingSchema: SettingSchema = {
  items: [
    {
      field: 'api',
      label: 'API 地址',
      description: '图床接口地址',
      type: 'text',
      placeholder: 'http(s)://域名，不含尾随斜杠',
      required: true,
    },
    {
      field: 'token',
      label: 'Token',
      description: '图床访问令牌',
      type: 'text',
      placeholder: '1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5',
      required: true,
    },
    {
      field: 'strategies',
      label: '存储策略',
      description: '选择存储策略，可选择多个策略',
      type: 'custom-selector',
      customMethod: 'getStrategies',
      required: true,
      multiple: true,
    },
    {
      field: 'useDefaultPermission',
      label: '使用固定权限',
      description: '启用后，上传界面的权限选择将被禁用，所有图片将使用设定权限',
      type: 'switch',
    },
    {
      field: 'defaultPermission',
      label: '默认权限',
      description: '在启用固定权限时使用的权限值',
      type: 'select',
      options: [
        { label: '公开', value: 1 },
        { label: '私有', value: 0 },
      ],
    },
  ],
  defaultValues: {
    api: '',
    token: '',
    strategies: null,
    useDefaultPermission: false,
    defaultPermission: 1,
  },
  shouldDisablePermissionSelect: (config: Record<string, any>) => {
    return Boolean(config.useDefaultPermission)
  },
  customMethods: {
    getStrategies,
  },
}
