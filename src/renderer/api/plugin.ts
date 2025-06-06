export const pluginApi = {
  async getAllPlugins() {
    const res = await window.ipcRenderer.invoke('get-all-plugins')
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '获取插件列表失败')
    }
    return data
  },

  async getPlugin(pluginId: string) {
    const res = await window.ipcRenderer.invoke('get-plugin', pluginId)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '获取插件详情失败')
    }
    return data
  },

  async installPlugin() {
    const res = await window.ipcRenderer.invoke('install-plugin')
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '安装插件失败')
    }
    return data
  },

  async searchNpmPlugins(query: string) {
    const res = await window.ipcRenderer.invoke('search-npm-plugins', query)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '搜索插件失败')
    }
    return data
  },

  async installNpmPlugin(packageName: string) {
    const res = await window.ipcRenderer.invoke('install-npm-plugin', packageName)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '插件安装失败')
    }
    return data
  },

  async uninstallPlugin(pluginId: string) {
    const res = await window.ipcRenderer.invoke('uninstall-plugin', pluginId)
    if (!res.success) {
      throw new Error(res.message || '卸载插件失败')
    }
    return true
  },

  async enablePlugin(pluginId: string) {
    const res = await window.ipcRenderer.invoke('enable-plugin', pluginId)
    if (!res.success) {
      throw new Error(res.message || '启用插件失败')
    }
    return true
  },

  async disablePlugin(pluginId: string) {
    const res = await window.ipcRenderer.invoke('disable-plugin', pluginId)
    if (!res.success) {
      throw new Error(res.message || '禁用插件失败')
    }
    return true
  },

  async getPluginSettingSchema(pluginId: string) {
    const res = await window.ipcRenderer.invoke('get-plugin-setting-schema', pluginId)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '获取插件设置模式失败')
    }
    return data
  },

  async shouldDisablePermissionSelect(pluginId: string, config: Record<string, any>) {
    const res = await window.ipcRenderer.invoke('should-disable-permission-select', pluginId, config)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '检查插件权限禁用状态失败')
    }
    return data
  },

  async uploadWithPlugin(pluginId: string, params: any) {
    const res = await window.ipcRenderer.invoke('upload-with-plugin', pluginId, params)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '使用插件上传文件失败')
    }
    return data
  },

  async callPluginCustomMethod(pluginId: string, methodName: string, params: any) {
    const res = await window.ipcRenderer.invoke('call-plugin-custom-method', pluginId, methodName, params)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '调用插件自定义方法失败')
    }
    return data
  },

  async getPluginData(pluginId: string, key: string) {
    const res = await window.ipcRenderer.invoke('get-plugin-data', pluginId, key)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '获取插件数据失败')
    }
    return data
  },

  async getAllPluginData(pluginId: string) {
    const res = await window.ipcRenderer.invoke('get-all-plugin-data', pluginId)
    const { data } = res
    if (!res.success) {
      throw new Error(res.message || '获取插件所有数据失败')
    }
    return data
  },

  async setPluginData(pluginId: string, key: string, data: any) {
    const res = await window.ipcRenderer.invoke('set-plugin-data', pluginId, key, data)
    if (!res.success) {
      throw new Error(res.message || '设置插件数据失败')
    }
    return true
  },
}
