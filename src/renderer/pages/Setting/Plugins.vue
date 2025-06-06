<script setup lang="ts">
import type { StoragePlugin } from '@giopic/core'
import type { NpmSearchResult } from '@/types'
import { onMounted, ref } from 'vue'
import { pluginApi } from '~/api/plugin'

defineOptions({
  name: 'Plugins',
})

const plugins = ref<StoragePlugin[]>([])
const npmSearchLoading = ref(false)
const npmSearchResults = ref<NpmSearchResult[]>([])
const npmSearchKeyword = ref('')
const pluginOperations = ref({
  loading: false,
  toggling: false,
  uninstalling: false,
  installing: false,
  currentPluginId: '',
})

function setDefaultEnabledState(plugin: StoragePlugin) {
  if (plugin.enabled === undefined) {
    plugin.enabled = plugin.isBuiltin || true
  }
  return plugin
}

async function fetchPlugins() {
  pluginOperations.value.loading = true
  try {
    const pluginList = await pluginApi.getAllPlugins()
    plugins.value = pluginList.map((p: StoragePlugin) => setDefaultEnabledState(p))
  }
  catch (e) {
    console.error('获取插件列表错误:', e)
    window.$message.error('获取插件列表时出现错误')
  }
  finally {
    pluginOperations.value.loading = false
  }
}

async function searchNpmPlugins() {
  if (!npmSearchKeyword.value.trim()) {
    npmSearchResults.value = []
    return
  }

  try {
    npmSearchLoading.value = true
    npmSearchResults.value = await pluginApi.searchNpmPlugins(npmSearchKeyword.value.trim())
  }
  catch (error) {
    window.$message.error(error instanceof Error ? error.message : String(error))
    npmSearchResults.value = []
  }
  finally {
    npmSearchLoading.value = false
  }
}

async function installFromNpm(packageName: string, pluginName: string) {
  try {
    pluginOperations.value.installing = true
    pluginOperations.value.currentPluginId = packageName

    const installedPlugin = await pluginApi.installNpmPlugin(packageName)

    if (installedPlugin) {
      window.$message.success(`插件 ${pluginName} 安装成功`)
      await fetchPlugins()
      npmSearchKeyword.value = ''
      npmSearchResults.value = []
    }
  }
  catch (error) {
    window.$message.error(error instanceof Error ? error.message : String(error))
  }
  finally {
    pluginOperations.value.installing = false
    pluginOperations.value.currentPluginId = ''
  }
}

async function installPlugin() {
  pluginOperations.value.installing = true
  try {
    const plugin = await pluginApi.installPlugin()
    window.$message.success(`安装插件 ${plugin.name} 成功`)
    await fetchPlugins()
  }
  catch (e) {
    console.error('安装插件错误:', e)
    window.$message.error('安装插件时出现错误')
  }
  finally {
    pluginOperations.value.installing = false
  }
}

async function uninstallPlugin(pluginId: string, pluginName: string) {
  window.$dialog.warning({
    title: '卸载插件',
    content: `确定要卸载插件 ${pluginName} 吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    autoFocus: false,
    onPositiveClick: async () => {
      pluginOperations.value.uninstalling = true
      pluginOperations.value.currentPluginId = pluginId
      try {
        await pluginApi.uninstallPlugin(pluginId)
        window.$message.success('卸载插件成功')
        await fetchPlugins()
      }
      catch (e) {
        console.error('卸载插件错误:', e)
        window.$message.error('卸载插件时出现错误')
      }
      finally {
        pluginOperations.value.uninstalling = false
        pluginOperations.value.currentPluginId = ''
      }
    },
  })
}

async function togglePluginState(plugin: StoragePlugin) {
  if (plugin.isBuiltin) {
    window.$message.warning('内置插件不能被禁用')
    return
  }

  pluginOperations.value.toggling = true
  pluginOperations.value.currentPluginId = plugin.id
  try {
    if (plugin.enabled) {
      await pluginApi.disablePlugin(plugin.id)
      plugin.enabled = false
      window.$message.success(`禁用插件 ${plugin.name} 成功`)
    }
    else {
      await pluginApi.enablePlugin(plugin.id)
      plugin.enabled = true
      window.$message.success(`启用插件 ${plugin.name} 成功`)
    }
  }
  catch (e) {
    console.error(`${plugin.enabled ? '禁用' : '启用'}插件错误:`, e)
    window.$message.error(`${plugin.enabled ? '禁用' : '启用'}插件时出现错误`)
  }
  finally {
    pluginOperations.value.toggling = false
    pluginOperations.value.currentPluginId = ''
  }
}

onMounted(async () => {
  await fetchPlugins()
})
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-medium">
        存储插件管理
      </h2>
      <div class="flex items-center gap-3">
        <n-input-group>
          <n-input
            v-model:value="npmSearchKeyword"
            placeholder="搜索GioPic插件..."
            clearable
            style="width: 220px"
            @keyup.enter="searchNpmPlugins"
          >
            <template #prefix>
              <div i-ph-magnifying-glass class="opacity-70" />
            </template>
          </n-input>
          <n-button
            type="primary"
            ghost
            class="flex-center"
            :disabled="npmSearchLoading"
            :loading="npmSearchLoading"
            @click="searchNpmPlugins"
          >
            搜索
          </n-button>
        </n-input-group>
        <n-button
          type="primary"
          :disabled="pluginOperations.installing"
          :loading="pluginOperations.installing"
          class="flex-center"
          @click="installPlugin"
        >
          导入插件
        </n-button>
      </div>
    </div>

    <div v-if="npmSearchKeyword && (npmSearchResults.length > 0 || npmSearchLoading)" class="mb-6">
      <h3 class="mb-3 text-lg font-medium">
        搜索结果
      </h3>
      <n-spin :show="npmSearchLoading">
        <div v-if="npmSearchResults.length === 0 && !npmSearchLoading" class="py-6">
          <n-empty description="暂无搜索结果" />
        </div>
        <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-2">
          <n-card
            v-for="pkg in npmSearchResults"
            :key="pkg.name"
            class="rounded-2"
            content-class="!p-5"
          >
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                <div class="wh-full flex-center rounded-lg bg-gray-100/80 text-2xl dark:bg-white/10">
                  <div i-carbon-box />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="mb-2 flex items-center gap-2">
                  <n-tooltip trigger="hover" :disabled="pkg.name.length <= 25">
                    <template #trigger>
                      <h3 class="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold leading-normal" style="max-width: 200px;">
                        {{ pkg.name }}
                      </h3>
                    </template>
                    {{ pkg.name }}
                  </n-tooltip>
                </div>

                <div class="line-clamp-3 mb-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ pkg.description || '暂无描述' }}
                </div>

                <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div class="flex items-center">
                    <div i-ph-tag class="mr-1" />
                    v{{ pkg.version }}
                  </div>
                  <div v-if="pkg.author?.name" class="flex items-center">
                    <div i-ph-user class="mr-1" />
                    {{ pkg.author.name }}
                  </div>
                </div>
              </div>

              <div class="flex flex-shrink-0 items-center gap-2">
                <n-button
                  type="primary"
                  size="small"
                  :disabled="pluginOperations.installing"
                  :loading="pluginOperations.installing && pluginOperations.currentPluginId === pkg.name"
                  @click="installFromNpm(pkg.name, pkg.name)"
                >
                  安装
                </n-button>
              </div>
            </div>
          </n-card>
        </div>
      </n-spin>
    </div>

    <div>
      <h3 class="mb-3 text-lg font-medium">
        已安装插件
      </h3>
      <div class="min-h-[300px]">
        <n-spin :show="pluginOperations.loading" description="加载插件中...">
          <n-empty
            v-if="plugins.length === 0"
            description="暂无存储插件"
            class="py-12"
          >
            <template #icon>
              <div i-carbon-cube class="text-5xl opacity-50" />
            </template>
            <template #extra>
              <n-button
                type="primary"
                class="mt-4"
                @click="installPlugin"
              >
                导入插件
              </n-button>
            </template>
          </n-empty>

          <transition-group
            v-else
            name="plugin-list"
            tag="div"
            class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-2"
          >
            <n-card
              v-for="plugin in plugins"
              :key="plugin.id"
              :class="{ disabled: plugin.enabled === false }"
              class="rounded-2"
              content-class="!p-5"
            >
              <div class="flex items-start gap-4">
                <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <div
                    v-if="plugin.icon"
                    class="wh-full bg-contain bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${plugin.icon})` }"
                  />
                  <div v-else class="wh-full flex-center rounded-lg bg-gray-100/80 text-2xl dark:bg-white/10">
                    <div i-carbon-box />
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center gap-2">
                    <n-tooltip trigger="hover" :disabled="plugin.name.length <= 25">
                      <template #trigger>
                        <h3 class="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold leading-normal" style="max-width: 200px;">
                          {{ plugin.name }}
                        </h3>
                      </template>
                      {{ plugin.name }}
                    </n-tooltip>
                    <n-tag v-if="plugin.isBuiltin" type="info" size="small">
                      内置
                    </n-tag>
                  </div>

                  <div class="line-clamp-3 mb-3 text-sm text-gray-700 dark:text-gray-300">
                    {{ plugin.description }}
                  </div>

                  <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center">
                      <div i-ph-tag class="mr-1" />
                      v{{ plugin.version }}
                    </div>
                    <div class="flex items-center">
                      <div i-ph-user class="mr-1" />
                      {{ plugin.author || '未知作者' }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-shrink-0 items-center gap-2">
                  <n-switch
                    v-if="!plugin.isBuiltin"
                    :value="plugin.enabled !== false"
                    :loading="pluginOperations.toggling && pluginOperations.currentPluginId === plugin.id"
                    :disabled="pluginOperations.uninstalling"
                    size="small"
                    @update:value="() => togglePluginState(plugin)"
                  >
                    <template #checked>
                      启用
                    </template>
                    <template #unchecked>
                      禁用
                    </template>
                  </n-switch>
                  <n-button
                    type="error"
                    size="small"
                    tertiary
                    :disabled="plugin.isBuiltin || pluginOperations.uninstalling"
                    :loading="pluginOperations.uninstalling && pluginOperations.currentPluginId === plugin.id"
                    @click="uninstallPlugin(plugin.id, plugin.name)"
                  >
                    <template #icon>
                      <div i-ph-trash />
                    </template>
                  </n-button>
                </div>
              </div>
            </n-card>
          </transition-group>
        </n-spin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.disabled {
  opacity: 0.6;
}

.plugin-list-enter-active,
.plugin-list-leave-active {
  transition: all 0.3s ease;
}

.plugin-list-enter-from,
.plugin-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
