<script setup lang="ts">
const route = useRoute('/Setting/[id]')
const id = computed(() => Number.parseInt(route.params.id))
const programStore = useProgramStore()
const pluginStore = usePluginStore()
const {
  getProgram,
  setProgramName,
  setProgramIcon,
} = programStore

const programType = computed(() => getProgram(id.value)?.type)
const programName = computed({
  get: () => getProgram(id.value)?.name,
  set: newName => setProgramName(id.value, newName),
})
const programIcon = computed({
  get: () => getProgram(id.value)?.icon || '',
  set: newIcon => setProgramIcon(id.value, newIcon),
})
const program = computed(() => getProgram(id.value))
const pluginId = computed(() => program.value?.pluginId)
const plugin = computed(() => {
  if (!pluginId.value)
    return null
  return pluginStore.getPlugin(pluginId.value)
})

async function exportConfig() {
  const data = programStore.exportProgram(id.value)
  if (!data)
    return

  try {
    const filePath = await window.ipcRenderer.invoke('export-program-config', {
      name: data.name || data.type,
      data,
    })
    if (filePath) {
      window.$message.success('配置已导出')
    }
  }
  catch (e: any) {
    window.$message.error(e?.message || '导出失败')
  }
}

onMounted(async () => {
  if (!pluginStore.loaded) {
    await pluginStore.loadPlugins()
  }
})
</script>

<template>
  <n-form>
    <setting-item
      title="存储备注"
      :desc="plugin ? `存储类型：${plugin.name}` : `存储类型：${programType || '未知类型'}`"
    >
      <code-input
        v-model:value="programName"
        type="text"
        :placeholder="plugin?.name || programType || '未知类型'"
      />
    </setting-item>

    <setting-item title="存储图标" desc="可设置当前存储配置的 Iconify 图标">
      <storage-icon-selector v-model="programIcon" :plugin-icon="plugin?.icon || ''" />
    </setting-item>

    <program-setting
      v-if="pluginId"
      :key="pluginId"
      :program-id="id"
      :plugin-id="pluginId"
    />

    <setting-item title="导出配置" desc="将当前存储配置导出为文件，可用于备份或迁移">
      <n-button size="small" @click="exportConfig">
        <template #icon>
          <div i-ph-export />
        </template>
        导出
      </n-button>
    </setting-item>
  </n-form>
</template>
