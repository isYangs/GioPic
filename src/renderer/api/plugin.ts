export const pluginApi = {
  async getAllPlugins() {
    return callIpc('get-all-plugins')
  },

  async getPlugin(pluginId: string) {
    return callIpc('get-plugin', pluginId)
  },

  async installPlugin() {
    return callIpc('install-plugin')
  },

  async searchNpmPlugins(query: string) {
    return callIpc('search-npm-plugins', query)
  },

  async installNpmPlugin(packageName: string) {
    return callIpc('install-npm-plugin', packageName)
  },

  async uninstallPlugin(pluginId: string) {
    await callIpc('uninstall-plugin', pluginId)
    return true
  },

  async enablePlugin(pluginId: string) {
    await callIpc('enable-plugin', pluginId)
    return true
  },

  async disablePlugin(pluginId: string) {
    await callIpc('disable-plugin', pluginId)
    return true
  },

  async getPluginSettingSchema(pluginId: string) {
    return callIpc('get-plugin-setting-schema', pluginId)
  },

  async shouldDisablePermissionSelect(pluginId: string, config: Record<string, any>) {
    return callIpc('should-disable-permission-select', { pluginId, config })
  },

  async uploadWithPlugin(pluginId: string, params: any) {
    return callIpc('upload-with-plugin', { pluginId, params })
  },

  async callPluginCustomMethod(pluginId: string, methodName: string, params: any) {
    return callIpc('call-plugin-custom-method', { pluginId, methodName, params })
  },

  async getPluginData(pluginId: string, key: string) {
    return callIpc('get-plugin-data', { pluginId, key })
  },

  async getAllPluginData(pluginId: string) {
    return callIpc('get-all-plugin-data', pluginId)
  },

  async setPluginData(pluginId: string, key: string, data: any) {
    await callIpc('set-plugin-data', { pluginId, key, data })
    return true
  },

  async removePluginData(pluginId: string, key: string) {
    await callIpc('remove-plugin-data', { pluginId, key })
    return true
  },

  async changeNpmRegistry(registry: string, custom: string) {
    await callIpc('change-npm-registry', { registry, custom })
    return true
  },

  async checkPluginUpdate(pluginId: string) {
    return callIpc('check-plugin-update', pluginId)
  },

  async updatePlugin(pluginId: string) {
    return callIpc('update-plugin', pluginId)
  },

  async checkAllPluginsUpdate() {
    return callIpc('check-all-plugins-update')
  },

  async updateAllPlugins() {
    return callIpc('update-all-plugins')
  },

  async installFromGitHub(repoUrl: string) {
    return callIpc('install-from-github', repoUrl)
  },

  async getRecommendedPlugins() {
    return callIpc('get-recommended-plugins')
  },

  async exportPluginsBackup() {
    return callIpc('export-plugins-backup')
  },

  async importPluginsBackup() {
    return callIpc('import-plugins-backup')
  },
}
