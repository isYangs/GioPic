import type { StoragePlugin } from '@giopic/core'
import { pluginApi } from '~/api'

interface PluginState {
  plugins: StoragePlugin[]
  loaded: boolean
}

export const usePluginStore = defineStore('pluginStore', () => {
  const state = reactive<PluginState>({
    plugins: [],
    loaded: false,
  })

  async function loadPlugins() {
    if (state.loaded)
      return

    try {
      const plugins = await pluginApi.getAllPlugins()
      state.plugins = plugins || []
      state.loaded = true
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载插件时出现错误'
      console.error('加载插件错误:', errorMessage)
      window.$message.error(errorMessage)
    }
  }

  function getAllPlugins() {
    return state.plugins
  }

  function getPlugin(pluginId: string) {
    return state.plugins.find(p => p.id === pluginId)
  }

  function getPluginsByType(type: string) {
    return state.plugins.filter(p => p.type === type)
  }

  function getPluginNameByType(type: string) {
    const plugin = state.plugins.find(p => p.type === type)
    return plugin ? plugin.name : ''
  }

  async function uninstallPlugin(pluginId: string) {
    try {
      const success = await pluginApi.uninstallPlugin(pluginId)
      if (success)
        state.plugins = state.plugins.filter(p => p.id !== pluginId)
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '卸载插件时出现错误'
      console.error('卸载插件错误:', errorMessage)
      window.$message.error(errorMessage)
    }
  }

  async function enablePlugin(pluginId: string) {
    try {
      const success = await pluginApi.enablePlugin(pluginId)
      if (success) {
        const plugin = state.plugins.find(p => p.id === pluginId)
        if (plugin) {
          plugin.enabled = true
        }
      }
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '启用插件时出现错误'
      console.error('启用插件错误:', errorMessage)
      window.$message.error(errorMessage)
    }
  }

  async function disablePlugin(pluginId: string) {
    try {
      const success = await pluginApi.disablePlugin(pluginId)
      if (success) {
        const plugin = state.plugins.find(p => p.id === pluginId)
        if (plugin) {
          plugin.enabled = false
        }
      }
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : '禁用插件时出现错误'
      console.error('禁用插件错误:', errorMessage)
      window.$message.error(errorMessage)
    }
  }

  return {
    ...toRefs(state),
    loadPlugins,
    getAllPlugins,
    getPlugin,
    getPluginsByType,
    getPluginNameByType,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
  }
})
