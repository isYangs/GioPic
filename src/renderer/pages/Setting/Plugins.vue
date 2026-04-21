<script setup lang="ts">
import type { NpmSearchResult } from '@/types'
import { useThemeVars } from 'naive-ui'
import StorageIcon from '~/components/Common/StorageIcon.vue'

defineOptions({
  name: 'Plugins',
})

const pluginStore = usePluginStore()
const plugins = computed(() => pluginStore.plugins)

const recommendedPlugins = ref<NpmSearchResult[]>([])
const modalSearchKeyword = ref('')
const modalSearchLoading = ref(false)
const modalSearchResults = ref<NpmSearchResult[]>([])
const githubRepoUrl = ref('')
const showNpmInstallModal = ref(false)
const showGithubInstallModal = ref(false)
const recommendedLoading = ref(false)

const pluginOperations = ref({
  loading: false,
  toggling: false,
  uninstalling: false,
  installing: false,
  updating: false,
  currentPluginId: '',
})

const sortBy = ref<'name' | 'date' | 'type'>('name')
const filterType = ref<'all' | 'enabled' | 'disabled'>('all')

const programStore = useProgramStore()
const themeVars = useThemeVars()

const pluginTypeTagStyle = computed(() => ({
  color: themeVars.value.primaryColor,
  backgroundColor: `color-mix(in srgb, ${themeVars.value.primaryColor} 16%, transparent)`,
  borderColor: `color-mix(in srgb, ${themeVars.value.primaryColor} 30%, transparent)`,
}))

const filteredAndSortedPlugins = computed(() => {
  let result = [...plugins.value]

  if (filterType.value === 'enabled') {
    result = result.filter(p => p.enabled !== false)
  }
  else if (filterType.value === 'disabled') {
    result = result.filter(p => p.enabled === false)
  }

  result.sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    }
    else if (sortBy.value === 'type') {
      return (a.type || '').localeCompare(b.type || '')
    }
    return 0
  })

  return result
})

const isFilteredEmptyState = computed(() => {
  return plugins.value.length > 0
    && filterType.value !== 'all'
    && filteredAndSortedPlugins.value.length === 0
})

const installedEmptyDescription = computed(() => {
  return isFilteredEmptyState.value ? '没有符合当前筛选条件的插件' : '暂无存储插件'
})

const installedEmptyActionText = computed(() => {
  return isFilteredEmptyState.value ? '查看全部' : '导入插件'
})

function resetPluginFilters() {
  filterType.value = 'all'
}

async function reloadPlugins() {
  pluginOperations.value.loading = true
  try {
    await pluginStore.reloadPlugins()
  }
  finally {
    pluginOperations.value.loading = false
  }
}

async function fetchRecommendedPlugins() {
  recommendedLoading.value = true
  try {
    const results = await window.ipcRenderer.invoke('get-recommended-plugins') as NpmSearchResult[]
    recommendedPlugins.value = results
  }
  catch {
    recommendedPlugins.value = []
  }
  finally {
    recommendedLoading.value = false
  }
}

async function modalSearchNpmPlugins() {
  if (!modalSearchKeyword.value.trim()) {
    modalSearchResults.value = []
    return
  }

  try {
    modalSearchLoading.value = true
    modalSearchResults.value = await window.ipcRenderer.invoke('search-npm-plugins', modalSearchKeyword.value.trim()) as NpmSearchResult[]
  }
  catch {
    modalSearchResults.value = []
    window.$message.error('搜索失败，请检查网络连接')
  }
  finally {
    modalSearchLoading.value = false
  }
}

function openNpmInstallModal() {
  showNpmInstallModal.value = true
  modalSearchKeyword.value = ''
  modalSearchResults.value = []
}

function isPluginInstalled(packageName: string) {
  return plugins.value.some(plugin => plugin.npmPackage === packageName || plugin.id === packageName)
}

async function installFromModalResult(packageName: string, pluginName: string) {
  try {
    pluginOperations.value.installing = true
    pluginOperations.value.currentPluginId = packageName

    const installedPlugin = await window.ipcRenderer.invoke('install-npm-plugin', packageName)

    if (installedPlugin) {
      window.$message.success(`插件 ${pluginName} 安装成功`)
      await reloadPlugins()
    }
  }
  catch (e: any) {
    window.$message.error(e?.message || '安装失败')
  }
  finally {
    pluginOperations.value.installing = false
    pluginOperations.value.currentPluginId = ''
  }
}

async function installFromGitHub() {
  const repoUrl = githubRepoUrl.value.trim()
  if (!repoUrl) {
    window.$message.warning('请输入GitHub仓库地址')
    return
  }

  try {
    pluginOperations.value.installing = true
    pluginOperations.value.currentPluginId = repoUrl

    const installedPlugin = await window.ipcRenderer.invoke('install-from-github', repoUrl)

    if (installedPlugin) {
      window.$message.success(`插件 ${installedPlugin.name} 安装成功`)
      await reloadPlugins()
      githubRepoUrl.value = ''
      showGithubInstallModal.value = false
    }
  }
  catch (e: any) {
    window.$message.error(e?.message || '安装失败')
  }
  finally {
    pluginOperations.value.installing = false
    pluginOperations.value.currentPluginId = ''
  }
}

async function installPlugin() {
  pluginOperations.value.installing = true
  try {
    const plugin = await window.ipcRenderer.invoke('install-plugin')
    if (plugin) {
      window.$message.success(`${plugin.name} 插件安装成功`)
      await reloadPlugins()
    }
  }
  catch (e: any) {
    window.$message.error(e?.message || '安装失败')
  }
  finally {
    pluginOperations.value.installing = false
  }
}

async function uninstallPlugin(pluginId: string, pluginName: string) {
  const relatedPrograms = programStore.programs.filter(program => program.pluginId === pluginId)
  const hasRelatedPrograms = relatedPrograms.length > 0

  let content = `确定要卸载插件 ${pluginName} 吗？此操作不可恢复。`
  if (hasRelatedPrograms) {
    const programNames = relatedPrograms.map(p => p.name || '未命名存储').join('、')
    content += `\n\n注意：这将同时删除以下使用此插件的存储程序：${programNames}`
  }

  window.$dialog.warning({
    title: '卸载插件',
    content,
    positiveText: '确定',
    negativeText: '取消',
    autoFocus: false,
    onPositiveClick: async () => {
      pluginOperations.value.uninstalling = true
      pluginOperations.value.currentPluginId = pluginId
      try {
        await pluginStore.uninstallPlugin(pluginId)

        if (hasRelatedPrograms) {
          const removedPrograms = programStore.removeProgramsByPluginId(pluginId)
          if (removedPrograms.length > 0) {
            window.$message.info(`同时删除了 ${removedPrograms.length} 个相关存储程序`)
          }
        }

        window.$message.success('插件卸载成功')
      }
      finally {
        pluginOperations.value.uninstalling = false
        pluginOperations.value.currentPluginId = ''
      }
    },
  })
}

async function togglePluginState(pluginId: string, pluginName: string, isBuiltin?: boolean, isEnabled?: boolean) {
  if (isBuiltin) {
    window.$message.warning('内置插件不能被禁用')
    return
  }

  pluginOperations.value.toggling = true
  pluginOperations.value.currentPluginId = pluginId
  try {
    if (isEnabled) {
      await pluginStore.disablePlugin(pluginId)
      window.$message.success(`已禁用 ${pluginName} 插件`)
    }
    else {
      await pluginStore.enablePlugin(pluginId)
      window.$message.success(`已启用 ${pluginName} 插件`)
    }
  }
  finally {
    pluginOperations.value.toggling = false
    pluginOperations.value.currentPluginId = ''
  }
}

async function updatePlugin(pluginId: string, pluginName: string) {
  window.$dialog.info({
    title: '更新插件',
    content: `确定要更新插件 ${pluginName} 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      pluginOperations.value.updating = true
      pluginOperations.value.currentPluginId = pluginId
      try {
        await window.ipcRenderer.invoke('update-plugin', pluginId)
        window.$message.success('插件更新成功')
        await reloadPlugins()
      }
      catch (e: any) {
        window.$message.error(e?.message || '更新失败')
      }
      finally {
        pluginOperations.value.updating = false
        pluginOperations.value.currentPluginId = ''
      }
    },
  })
}

async function checkAllUpdates() {
  try {
    const results = await window.ipcRenderer.invoke('check-all-plugins-update')
    const hasUpdates = results.filter((r: any) => r.hasUpdate)

    if (hasUpdates.length === 0) {
      window.$message.success('所有插件都是最新版本')
    }
    else {
      window.$message.info(`发现 ${hasUpdates.length} 个插件有更新`)
    }

    return results
  }
  catch (e: any) {
    window.$message.error(e?.message || '检查更新失败')
    return []
  }
}

async function updateAllPlugins() {
  window.$dialog.warning({
    title: '批量更新',
    content: '确定要更新所有有新版本的插件吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const results = await window.ipcRenderer.invoke('update-all-plugins')
        const success = results.filter((r: any) => r.success).length
        const failed = results.filter((r: any) => !r.success).length

        if (failed === 0) {
          window.$message.success(`成功更新 ${success} 个插件`)
        }
        else {
          window.$message.warning(`更新完成：成功 ${success} 个，失败 ${failed} 个`)
        }

        await reloadPlugins()
      }
      catch (e: any) {
        window.$message.error(e?.message || '批量更新失败')
      }
    },
  })
}

async function exportBackup() {
  try {
    const filePath = await window.ipcRenderer.invoke('export-plugins-backup')
    if (filePath) {
      window.$message.success(`备份已导出到: ${filePath}`)
    }
  }
  catch (e: any) {
    window.$message.error(e?.message || '导出失败')
  }
}

async function importBackup() {
  try {
    const result = await window.ipcRenderer.invoke('import-plugins-backup')

    if (!result) {
      return
    }

    if (result.failed === 0 && result.skipped === 0) {
      window.$message.success(`成功导入 ${result.success} 个插件`)
    }
    else if (result.failed === 0) {
      window.$message.success(`导入完成：成功 ${result.success} 个，跳过 ${result.skipped} 个已存在的插件`)
    }
    else {
      window.$message.warning(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个，跳过 ${result.skipped} 个`)
    }

    await reloadPlugins()
  }
  catch (e: any) {
    window.$message.error(e?.message || '导入失败')
  }
}

onMounted(async () => {
  await reloadPlugins()
  await fetchRecommendedPlugins()
})
</script>

<template>
  <div class="h-full w-full flex flex-col" data-testid="plugins-page">
    <div class="mb-4 flex flex-shrink-0 items-center justify-between gap-4">
      <h2 class="flex-shrink-0 text-base font-medium">
        存储插件
      </h2>
      <div class="flex items-center gap-3">
        <n-dropdown
          :options="[
            { label: '从插件源安装', key: 'npm' },
            { label: '从 GitHub 安装', key: 'github' },
            { label: '导入本地插件', key: 'local' },
            { type: 'divider' },
            { label: '检查全部更新', key: 'check-updates' },
            { label: '更新全部插件', key: 'update-all' },
            { type: 'divider' },
            { label: '导出备份', key: 'export' },
            { label: '导入备份', key: 'import' },
          ]" @select="(key) => {
            if (key === 'npm') openNpmInstallModal()
            else if (key === 'github') showGithubInstallModal = true
            else if (key === 'local') installPlugin()
            else if (key === 'check-updates') checkAllUpdates()
            else if (key === 'update-all') updateAllPlugins()
            else if (key === 'export') exportBackup()
            else if (key === 'import') importBackup()
          }"
        >
          <n-button
            type="primary"
            size="medium"
            :disabled="pluginOperations.installing"
          >
            安装插件
          </n-button>
        </n-dropdown>
      </div>
    </div>

    <!-- 推荐插件 -->
    <div v-if="recommendedPlugins.length > 0" class="mb-5 flex-shrink-0">
      <h3 class="mb-2 text-sm font-medium op-70">
        推荐插件
      </h3>
      <n-spin :show="recommendedLoading">
        <div class="flex flex-col gap-2">
          <div
            v-for="pkg in recommendedPlugins"
            :key="pkg.name"
            class="group flex cursor-pointer items-center gap-3 border border-gray-200/60 rounded-lg bg-white px-4 py-3.5 shadow-sm transition-all dark:border-white/8 hover:border-primary/40 dark:bg-white/5 hover:shadow-md dark:hover:border-primary/30"
          >
            <div class="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg">
              <div class="wh-full flex-center rounded-lg bg-gray-200/60 text-lg dark:bg-white/8">
                <div i-ph-star class="op-60" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ pkg.name }}</span>
                <span class="text-xs op-40">v{{ pkg.version }}</span>
                <span v-if="pkg.author?.name" class="text-xs op-40">· {{ pkg.author.name }}</span>
              </div>
              <div class="mt-0.5 truncate text-xs op-50">
                {{ pkg.description || '暂无描述' }}
              </div>
            </div>

            <n-button
              type="primary"
              size="small"
              :disabled="pluginOperations.installing || isPluginInstalled(pkg.name)"
              :loading="pluginOperations.installing && pluginOperations.currentPluginId === pkg.name"
              @click="installFromModalResult(pkg.name, pkg.name)"
            >
              <template #icon>
                <div i-ph-download-simple />
              </template>
              {{ isPluginInstalled(pkg.name) ? '已安装' : '安装' }}
            </n-button>
          </div>
        </div>
      </n-spin>
    </div>

    <!-- 已安装插件 -->
    <div class="min-h-0 flex flex-1 flex-col">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-medium op-70">
          已安装
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <n-select
            v-model:value="filterType"
            size="medium"
            class="w-32"
            :options="[
              { label: '全部', value: 'all' },
              { label: '已启用', value: 'enabled' },
              { label: '已禁用', value: 'disabled' },
            ]"
          />
          <n-select
            v-model:value="sortBy"
            size="medium"
            class="w-32"
            :options="[
              { label: '按名称', value: 'name' },
              { label: '按类型', value: 'type' },
            ]"
          />
        </div>
      </div>
      <div class="min-h-0 flex-1">
        <n-spin :show="pluginOperations.loading" description="加载插件中..." class="h-full">
          <div v-if="filteredAndSortedPlugins.length === 0" class="plugin-empty-state">
            <n-empty :description="installedEmptyDescription">
              <template #icon>
                <div i-carbon-cube class="text-5xl opacity-50" />
              </template>
              <template #extra>
                <n-button
                  type="primary"
                  class="mt-4"
                  @click="isFilteredEmptyState ? resetPluginFilters() : installPlugin()"
                >
                  {{ installedEmptyActionText }}
                </n-button>
              </template>
            </n-empty>
          </div>

          <transition-group
            v-else
            name="plugin-list"
            tag="div"
            class="flex flex-col gap-2"
          >
            <div
              v-for="plugin in filteredAndSortedPlugins"
              :key="plugin.id"
              :class="{ 'op-50': plugin.enabled === false }"
              class="group plugin-item flex cursor-pointer items-center gap-3 border border-gray-200/60 rounded-lg bg-white px-4 py-3.5 shadow-sm transition-all dark:border-white/8 hover:border-primary/40 dark:bg-white/5 hover:shadow-md dark:hover:border-primary/30"
            >
              <div class="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg">
                <div class="wh-full flex-center rounded-lg bg-gray-200/60 text-lg dark:bg-white/8">
                  <storage-icon :icon="plugin.icon" default-icon="ph:puzzle-piece-bold" :size="20" alt="plugin icon" />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ plugin.name }}</span>
                  <span class="text-xs op-40">v{{ plugin.version }}</span>
                  <n-tag v-if="plugin.isBuiltin" size="tiny" :bordered="false">
                    内置
                  </n-tag>
                  <span
                    v-if="plugin.type"
                    class="plugin-type-tag"
                    :style="pluginTypeTagStyle"
                  >
                    {{ plugin.type }}
                  </span>
                </div>
                <div class="mt-0.5 truncate text-xs op-50">
                  {{ plugin.description || '暂无描述' }}
                </div>
              </div>

              <div class="flex flex-shrink-0 items-center gap-2">
                <n-button
                  v-if="!plugin.isBuiltin && plugin.installSource !== 'local'"
                  quaternary
                  size="tiny"
                  :disabled="pluginOperations.updating"
                  :loading="pluginOperations.updating && pluginOperations.currentPluginId === plugin.id"
                  class="op-40 hover:op-100"
                  @click="updatePlugin(plugin.id, plugin.name)"
                >
                  <template #icon>
                    <div i-ph-arrows-clockwise class="text-xs" />
                  </template>
                </n-button>
                <n-switch
                  v-if="!plugin.isBuiltin"
                  size="small"
                  :value="plugin.enabled !== false"
                  :loading="pluginOperations.toggling && pluginOperations.currentPluginId === plugin.id"
                  :disabled="pluginOperations.uninstalling"
                  @update:value="() => togglePluginState(plugin.id, plugin.name, plugin.isBuiltin, plugin.enabled)"
                />
                <n-button
                  v-if="!plugin.isBuiltin"
                  quaternary
                  size="tiny"
                  :disabled="pluginOperations.uninstalling"
                  :loading="pluginOperations.uninstalling && pluginOperations.currentPluginId === plugin.id"
                  class="op-40 hover:op-100 hover:text-red-500!"
                  @click="uninstallPlugin(plugin.id, plugin.name)"
                >
                  <template #icon>
                    <div i-ph-trash class="text-xs" />
                  </template>
                </n-button>
              </div>
            </div>
          </transition-group>
        </n-spin>
      </div>
    </div>

    <!-- npm安装模态框 -->
    <n-modal
      v-model:show="showNpmInstallModal"
      preset="card"
      title="从插件源安装"
      style="width: 520px"
      :auto-focus="false"
    >
      <div class="flex flex-col gap-4">
        <div class="flex gap-2">
          <n-input
            v-model:value="modalSearchKeyword"
            placeholder="搜索插件，如 @giopic/lsky-plugin"
            clearable
            @keyup.enter="modalSearchNpmPlugins"
          >
            <template #prefix>
              <div i-ph-magnifying-glass class="op-50" />
            </template>
          </n-input>
          <n-button
            :disabled="modalSearchLoading || !modalSearchKeyword.trim()"
            :loading="modalSearchLoading"
            @click="modalSearchNpmPlugins"
          >
            搜索
          </n-button>
        </div>

        <div v-if="modalSearchResults.length > 0" class="max-h-[360px] flex flex-col gap-2 overflow-y-auto">
          <div
            v-for="pkg in modalSearchResults"
            :key="pkg.name"
            class="flex items-center gap-3 border border-gray-200/60 rounded-lg bg-white px-3 py-2.5 transition-all dark:border-white/8 hover:border-primary/40 dark:bg-white/5 dark:hover:border-primary/30"
          >
            <div class="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
              <div class="wh-full flex-center rounded-lg bg-gray-200/60 text-base dark:bg-white/8">
                <div i-ph-package class="op-60" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ pkg.name }}</span>
                <span class="text-xs op-40">v{{ pkg.version }}</span>
              </div>
              <div class="mt-0.5 truncate text-xs op-50">
                {{ pkg.description || '暂无描述' }}
              </div>
            </div>

            <n-button
              type="primary"
              size="small"
              :disabled="pluginOperations.installing || isPluginInstalled(pkg.name)"
              :loading="pluginOperations.installing && pluginOperations.currentPluginId === pkg.name"
              @click="installFromModalResult(pkg.name, pkg.name)"
            >
              <template #icon>
                <div i-ph-download-simple />
              </template>
              {{ isPluginInstalled(pkg.name) ? '已安装' : '安装' }}
            </n-button>
          </div>
        </div>

        <n-empty
          v-else-if="modalSearchKeyword && !modalSearchLoading && modalSearchResults.length === 0"
          description="暂无搜索结果"
          class="py-4"
        />

        <div v-else class="py-4 text-center text-xs op-40">
          输入关键词搜索插件源上的 GioPic 插件
        </div>
      </div>
    </n-modal>

    <!-- GitHub安装模态框 -->
    <n-modal
      v-model:show="showGithubInstallModal"
      preset="card"
      title="从 GitHub 安装插件"
      style="width: 420px"
      :auto-focus="false"
    >
      <div class="flex flex-col gap-4">
        <n-input
          v-model:value="githubRepoUrl"
          placeholder="输入仓库地址，如 username/repo"
          clearable
          @keyup.enter="installFromGitHub"
        >
          <template #prefix>
            <div i-ph-github-logo class="op-50" />
          </template>
        </n-input>
        <div class="text-xs op-50">
          支持从 GitHub Release 安装插件，需要仓库有发布的 .tgz 文件
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button size="small" @click="showGithubInstallModal = false">
            取消
          </n-button>
          <n-button
            type="primary"
            size="small"
            :disabled="!githubRepoUrl.trim() || pluginOperations.installing"
            :loading="pluginOperations.installing"
            @click="installFromGitHub"
          >
            安装
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.plugin-empty-state {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plugin-type-tag {
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0 8px;
  min-height: 20px;
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  white-space: nowrap;
}

.plugin-list-enter-active,
.plugin-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.plugin-list-enter-from,
.plugin-list-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.plugin-list-enter-active {
  transition-delay: 0.05s;
}
</style>
