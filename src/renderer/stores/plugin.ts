import type { StoragePlugin } from '@giopic/core'

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
      const plugins = await window.ipcRenderer.invoke('get-all-plugins')
      if (!Array.isArray(plugins)) {
        console.error('插件列表不是数组类型')
        state.plugins = []
        return
      }
      state.plugins = plugins.map((p: StoragePlugin) => {
        if (p.enabled === undefined)
          p.enabled = true
        return p
      })
      state.loaded = true
    }
    catch (error) {
      console.error('加载插件失败:', error)
      state.plugins = []
    }
  }

  async function reloadPlugins() {
    state.loaded = false
    await loadPlugins()
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
    const success = await window.ipcRenderer.invoke('uninstall-plugin', pluginId)
    if (success)
      state.plugins = state.plugins.filter(p => p.id !== pluginId)
  }

  async function enablePlugin(pluginId: string) {
    const success = await window.ipcRenderer.invoke('enable-plugin', pluginId)
    if (success) {
      const plugin = state.plugins.find(p => p.id === pluginId)
      if (plugin) {
        plugin.enabled = true
      }
    }
  }

  async function disablePlugin(pluginId: string) {
    const success = await window.ipcRenderer.invoke('disable-plugin', pluginId)
    if (success) {
      const plugin = state.plugins.find(p => p.id === pluginId)
      if (plugin) {
        plugin.enabled = false
      }
    }
  }

  return {
    ...toRefs(state),
    loadPlugins,
    reloadPlugins,
    getAllPlugins,
    getPlugin,
    getPluginsByType,
    getPluginNameByType,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
  }
})
