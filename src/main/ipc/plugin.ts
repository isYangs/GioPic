import { getPluginDataStore } from '@giopic/core'
import { dialog, ipcMain } from 'electron'
import { pluginManager } from '../services/PluginManager'
import { setStore } from '../stores'
import logger from '../utils/logger'
import { runE2EUploadMock } from './e2e'

const pluginLogger = logger.scope('PluginIPC')

interface PluginMethodParams {
  pluginId: string
  methodName: string
  params: any
}

interface PluginDataParams {
  pluginId: string
  key: string
  data?: any
}

interface PermissionSelectParams {
  pluginId: string
  config: Record<string, any>
}

interface UploadWithPluginParams {
  pluginId: string
  params: any
}

export function registerPluginIpc() {
  ipcMain.handle('get-all-plugins', async () => {
    try {
      const data = pluginManager.getAllPlugins()
      return data
    }
    catch (e) {
      pluginLogger.error('[plugin] get all plugins error', e)
      throw new Error('获取插件列表失败')
    }
  })

  ipcMain.handle('get-plugin', async (_event, pluginId: string) => {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }
      return plugin
    }
    catch (e) {
      pluginLogger.error(`[plugin] get plugin ${pluginId} error`, e)
      throw new Error('获取插件详情失败')
    }
  })

  ipcMain.handle('install-plugin', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择插件文件或文件夹',
        properties: ['openDirectory', 'openFile'],
        filters: [
          { name: '插件文件', extensions: ['zip', 'tgz', 'tar.gz'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })

      if (canceled || filePaths.length === 0) {
        return null
      }

      const pluginPath = filePaths[0]
      const plugin = await pluginManager.installPlugin(pluginPath)

      if (!plugin) {
        throw new Error('插件安装失败')
      }

      return plugin
    }
    catch (e) {
      pluginLogger.error('[plugin] install plugin error', e)
      throw new Error('插件安装失败')
    }
  })

  ipcMain.handle('search-npm-plugins', async (_event, query: string) => {
    try {
      const results = await pluginManager.searchNpmPlugins(query)
      return results
    }
    catch (e) {
      pluginLogger.error(`[plugin] search npm plugins error: ${query}`, e)
      throw new Error('搜索插件失败')
    }
  })

  ipcMain.handle('install-npm-plugin', async (_event, packageName: string) => {
    try {
      const plugin = await pluginManager.installNpmPlugin(packageName)
      if (!plugin) {
        throw new Error('插件安装失败')
      }
      return plugin
    }
    catch (e) {
      pluginLogger.error(`[plugin] install npm plugin error: ${packageName}`, e)
      throw new Error('插件安装失败')
    }
  })

  ipcMain.handle('uninstall-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.uninstallPlugin(pluginId)
      if (!result) {
        throw new Error('插件卸载失败')
      }
      return result
    }
    catch (e) {
      pluginLogger.error(`[plugin] uninstall plugin error: ${pluginId}`, e)
      throw new Error('插件卸载失败')
    }
  })

  ipcMain.handle('get-plugin-setting-schema', async (_event, pluginId: string) => {
    try {
      const settingSchema = await pluginManager.getPluginSettingSchema(pluginId)
      if (!settingSchema) {
        throw new Error('获取插件设置模式失败')
      }
      return settingSchema
    }
    catch (e) {
      pluginLogger.error(`[plugin] get plugin setting schema error: ${pluginId}`, e)
      throw new Error('获取插件设置模式失败')
    }
  })

  ipcMain.handle('upload-with-plugin', async (_event, params: UploadWithPluginParams) => {
    try {
      const { pluginId, params: uploadParams } = params
      const mockResult = await runE2EUploadMock(pluginId, uploadParams)
      if (mockResult) {
        return mockResult
      }
      const result = await pluginManager.uploadWithPlugin(pluginId, uploadParams)
      return result
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      pluginLogger.error(`[plugin] upload with plugin error: ${pluginId}`, e)
      throw new Error(e instanceof Error ? e.message : '上传失败')
    }
  })

  ipcMain.handle('should-disable-permission-select', async (_event, params: PermissionSelectParams) => {
    try {
      const { pluginId, config } = params
      const result = await pluginManager.shouldDisablePermissionSelect(pluginId, config)
      return result
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      pluginLogger.error(`[plugin] should disable permission select error: ${pluginId}`, e)
      throw new Error('检查插件权限禁用状态失败')
    }
  })

  ipcMain.handle('enable-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.enablePlugin(pluginId)
      if (!result) {
        throw new Error('启用插件失败')
      }
      return result
    }
    catch (e) {
      pluginLogger.error(`[plugin] enable plugin error: ${pluginId}`, e)
      throw new Error('启用插件失败')
    }
  })

  ipcMain.handle('disable-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.disablePlugin(pluginId)
      if (!result) {
        throw new Error('禁用插件失败')
      }
      return result
    }
    catch (e) {
      pluginLogger.error(`[plugin] disable plugin error: ${pluginId}`, e)
      throw new Error('禁用插件失败')
    }
  })

  ipcMain.handle('call-plugin-custom-method', async (_event, params: PluginMethodParams) => {
    try {
      const { pluginId, methodName, params: methodParams } = params
      const result = await pluginManager.callPluginCustomMethod(pluginId, methodName, methodParams)
      return result
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      const methodName = params?.methodName || 'unknown'
      pluginLogger.error(`[plugin] call plugin custom method error: ${pluginId}.${methodName}`, e)
      throw new Error('调用插件自定义方法失败')
    }
  })

  ipcMain.handle('get-plugin-data', async (_event, params: PluginDataParams) => {
    try {
      const { pluginId, key } = params
      const data = getPluginDataStore().getData(pluginId, key)
      return data
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      const key = params?.key || 'unknown'
      pluginLogger.error(`[plugin] get plugin data error: ${pluginId}.${key}`, e)
      throw new Error('获取插件数据失败')
    }
  })

  ipcMain.handle('get-all-plugin-data', async (_event, pluginId: string) => {
    try {
      const data = getPluginDataStore().getAllData(pluginId)
      return data
    }
    catch (e) {
      pluginLogger.error(`[plugin] get all plugin data error: ${pluginId}`, e)
      throw new Error('获取插件所有数据失败')
    }
  })

  ipcMain.handle('set-plugin-data', async (_event, params: PluginDataParams) => {
    try {
      const { pluginId, key, data } = params
      getPluginDataStore().setData(pluginId, key, data)
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      const key = params?.key || 'unknown'
      pluginLogger.error(`[plugin] set plugin data error: ${pluginId}.${key}`, e)
      throw new Error('设置插件数据失败')
    }
  })

  ipcMain.handle('remove-plugin-data', async (_event, params: PluginDataParams) => {
    try {
      const { pluginId, key } = params
      getPluginDataStore().removeData(pluginId, key)
    }
    catch (e) {
      const pluginId = params?.pluginId || 'unknown'
      const key = params?.key || 'unknown'
      pluginLogger.error(`[plugin] remove plugin data error: ${pluginId}.${key}`, e)
      throw new Error('删除插件数据失败')
    }
  })

  ipcMain.handle('change-npm-registry', (_event, params: { registry: string, custom: string }) => {
    try {
      const { registry, custom } = params
      setStore('npmRegistry', registry)
      setStore('customNpmRegistry', custom)
      pluginManager.updateNpmRegistryConfig()
    }
    catch (e) {
      pluginLogger.error(`[plugin] change npm registry error: ${params.registry}`, e)
      throw new Error('切换 npm 源失败')
    }
  })

  ipcMain.handle('check-plugin-update', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.checkPluginUpdate(pluginId)
      return result
    }
    catch (e) {
      pluginLogger.error(`[plugin] check plugin update error: ${pluginId}`, e)
      throw new Error('检查插件更新失败')
    }
  })

  ipcMain.handle('update-plugin', async (_event, pluginId: string) => {
    try {
      const plugin = await pluginManager.updatePlugin(pluginId)
      if (!plugin) {
        throw new Error('插件更新失败')
      }
      return plugin
    }
    catch (e) {
      pluginLogger.error(`[plugin] update plugin error: ${pluginId}`, e)
      throw new Error('插件更新失败')
    }
  })

  ipcMain.handle('check-all-plugins-update', async () => {
    try {
      const results = await pluginManager.checkAllPluginsUpdate()
      return results
    }
    catch (e) {
      pluginLogger.error('[plugin] check all plugins update error', e)
      throw new Error('批量检查更新失败')
    }
  })

  ipcMain.handle('update-all-plugins', async () => {
    try {
      const results = await pluginManager.updateAllPlugins()
      return results
    }
    catch (e) {
      pluginLogger.error('[plugin] update all plugins error', e)
      throw new Error('批量更新插件失败')
    }
  })

  ipcMain.handle('install-from-github', async (_event, repoUrl: string) => {
    try {
      const plugin = await pluginManager.installFromGitHub(repoUrl)
      if (!plugin) {
        throw new Error('从 GitHub 安装插件失败')
      }
      return plugin
    }
    catch (e) {
      pluginLogger.error(`[plugin] install from github error: ${repoUrl}`, e)
      throw new Error('从 GitHub 安装失败')
    }
  })

  ipcMain.handle('get-recommended-plugins', async () => {
    try {
      const results = await pluginManager.getRecommendedPlugins()
      return results
    }
    catch (e) {
      pluginLogger.error('[plugin] get recommended plugins error', e)
      throw new Error('获取推荐插件失败')
    }
  })

  ipcMain.handle('export-plugins-backup', async () => {
    try {
      const backupJson = await pluginManager.exportPluginsBackup()
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出插件备份',
        defaultPath: `giopic-plugins-backup-${Date.now()}.json`,
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      })

      if (canceled || !filePath) {
        return null
      }

      const fs = await import('node:fs')
      fs.writeFileSync(filePath, backupJson, 'utf-8')

      return filePath
    }
    catch (e) {
      pluginLogger.error('[plugin] export plugins backup error', e)
      throw new Error('导出插件备份失败')
    }
  })

  ipcMain.handle('import-plugins-backup', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '导入插件备份',
        properties: ['openFile'],
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      })

      if (canceled || filePaths.length === 0) {
        return null
      }

      const fs = await import('node:fs')
      const backupJson = fs.readFileSync(filePaths[0], 'utf-8')

      const result = await pluginManager.importPluginsBackup(backupJson)
      return result
    }
    catch (e) {
      pluginLogger.error('[plugin] import plugins backup error', e)
      throw new Error('导入插件备份失败')
    }
  })
}
