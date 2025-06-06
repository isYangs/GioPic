import logger from '../utils/logger'
import { pluginManager } from './PluginManager'

const setupLogger = logger.scope('PluginSetup')

export async function setupBuiltinPlugins(): Promise<void> {
  try {
    setupLogger.info('开始初始化内置插件')

    const builtinPlugins = pluginManager.getAllPlugins().filter(p => p.isBuiltin)

    for (const plugin of builtinPlugins) {
      setupLogger.info(`内置插件已加载: ${plugin.name} (${plugin.id}) ${plugin.npmPackage ? '(NPM包)' : ''}`)
    }

    setupLogger.info('内置插件初始化完成')
  }
  catch (e) {
    setupLogger.error('初始化内置插件失败:', e)
  }
}
