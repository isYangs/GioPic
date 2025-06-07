import { getPluginDataStore } from '@giopic/core'
import { dialog, ipcMain } from 'electron'
import { pluginManager } from '../services/PluginManager'
import { setStore } from '../stores'
import logger from '../utils/logger'

const pluginLogger = logger.scope('PluginIPC')

export function registerPluginIpc() {
  ipcMain.handle('get-all-plugins', async () => {
    try {
      const data = pluginManager.getAllPlugins()
      return {
        success: true,
        data,
      }
    }
    catch (e) {
      pluginLogger.error('获取插件列表失败', e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取插件列表失败',
      }
    }
  })

  ipcMain.handle('get-plugin', async (_event, pluginId: string) => {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        return {
          success: false,
          message: '插件不存在',
        }
      }
      return {
        success: true,
        data: plugin,
      }
    }
    catch (e) {
      pluginLogger.error(`获取插件 ${pluginId} 详情失败`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取插件详情失败',
      }
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
        return {
          success: false,
          message: '用户取消操作',
        }
      }

      const pluginPath = filePaths[0]
      const plugin = await pluginManager.installPlugin(pluginPath)

      if (!plugin) {
        return {
          success: false,
          message: '插件安装失败',
        }
      }

      return {
        success: true,
        data: plugin,
      }
    }
    catch (e) {
      pluginLogger.error('插件安装失败', e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '插件安装失败',
      }
    }
  })

  ipcMain.handle('search-npm-plugins', async (_event, query: string) => {
    try {
      const results = await pluginManager.searchNpmPlugins(query)
      return {
        success: true,
        data: results,
      }
    }
    catch (e) {
      pluginLogger.error(`搜索插件失败: ${query}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '搜索插件失败',
      }
    }
  })

  ipcMain.handle('install-npm-plugin', async (_event, packageName: string) => {
    try {
      const plugin = await pluginManager.installNpmPlugin(packageName)
      if (!plugin) {
        return {
          success: false,
          message: '插件安装失败',
        }
      }
      return {
        success: true,
        data: plugin,
      }
    }
    catch (e) {
      pluginLogger.error(`插件安装失败: ${packageName}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '插件安装失败',
      }
    }
  })

  ipcMain.handle('uninstall-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.uninstallPlugin(pluginId)
      if (!result) {
        return {
          success: false,
          message: '插件卸载失败',
        }
      }
      return {
        success: true,
      }
    }
    catch (e) {
      pluginLogger.error(`插件卸载失败: ${pluginId}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '插件卸载失败',
      }
    }
  })

  ipcMain.handle('get-plugin-setting-schema', async (_event, pluginId: string) => {
    try {
      const settingSchema = await pluginManager.getPluginSettingSchema(pluginId)
      if (!settingSchema) {
        return {
          success: false,
          message: '获取插件设置模式失败',
        }
      }
      return {
        success: true,
        data: settingSchema,
      }
    }
    catch (e) {
      pluginLogger.error(`获取插件 ${pluginId} 设置模式失败`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取插件设置模式失败',
      }
    }
  })

  ipcMain.handle('upload-with-plugin', async (_event, pluginId: string, params: any) => {
    try {
      const result = await pluginManager.uploadWithPlugin(pluginId, params)
      return {
        success: true,
        data: result,
      }
    }
    catch (e) {
      pluginLogger.error(`使用插件 ${pluginId} 上传失败`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '上传失败',
      }
    }
  })

  ipcMain.handle('should-disable-permission-select', async (_event, pluginId: string, config: Record<string, any>) => {
    try {
      const result = await pluginManager.shouldDisablePermissionSelect(pluginId, config)
      return {
        success: true,
        data: result,
      }
    }
    catch (e) {
      pluginLogger.error(`检查插件权限禁用状态失败: ${pluginId}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '检查插件权限禁用状态失败',
      }
    }
  })

  ipcMain.handle('enable-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.enablePlugin(pluginId)
      if (!result) {
        return {
          success: false,
          message: '启用插件失败',
        }
      }
      return {
        success: true,
      }
    }
    catch (e) {
      pluginLogger.error(`启用插件 ${pluginId} 失败`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '启用插件失败',
      }
    }
  })

  ipcMain.handle('disable-plugin', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.disablePlugin(pluginId)
      if (!result) {
        return {
          success: false,
          message: '禁用插件失败',
        }
      }
      return {
        success: true,
      }
    }
    catch (e) {
      pluginLogger.error(`禁用插件 ${pluginId} 失败`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '禁用插件失败',
      }
    }
  })

  ipcMain.handle('call-plugin-custom-method', async (_event, pluginId: string, methodName: string, params: any) => {
    try {
      const result = await pluginManager.callPluginCustomMethod(pluginId, methodName, params)
      return {
        success: true,
        data: result,
      }
    }
    catch (e) {
      pluginLogger.error(`调用插件自定义方法失败: ${pluginId}.${methodName}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '调用插件自定义方法失败',
      }
    }
  })

  ipcMain.handle('get-plugin-data', async (_event, pluginId: string, key: string) => {
    try {
      const data = getPluginDataStore().getData(pluginId, key)
      return {
        success: true,
        data,
      }
    }
    catch (e) {
      pluginLogger.error(`获取插件数据失败: ${pluginId}.${key}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取插件数据失败',
      }
    }
  })

  ipcMain.handle('get-all-plugin-data', async (_event, pluginId: string) => {
    try {
      const data = getPluginDataStore().getAllData(pluginId)
      return {
        success: true,
        data,
      }
    }
    catch (e) {
      pluginLogger.error(`获取插件所有数据失败: ${pluginId}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '获取插件所有数据失败',
      }
    }
  })

  ipcMain.handle('set-plugin-data', async (_event, pluginId: string, key: string, data: any) => {
    try {
      getPluginDataStore().setData(pluginId, key, data)
      return {
        success: true,
      }
    }
    catch (e) {
      pluginLogger.error(`设置插件数据失败: ${pluginId}.${key}`, e)
      return {
        success: false,
        message: e instanceof Error ? e.message : '设置插件数据失败',
      }
    }
  })

  ipcMain.on('change-npm-registry', (_e, { registry, custom }: { registry: string, custom: string }) => {
    setStore('npmRegistry', registry)
    setStore('customNpmRegistry', custom)
    pluginManager.updateNpmRegistryConfig()
  })
}
