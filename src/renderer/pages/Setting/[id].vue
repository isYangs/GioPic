<script setup lang="ts">
import { usePluginStore, useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = computed(() => Number.parseInt(route.params.id))
const programStore = useProgramStore()
const pluginStore = usePluginStore()
const {
  getProgram,
  setProgramName,
} = programStore

const programType = computed(() => getProgram(id.value)?.type)
const programName = computed({
  get: () => getProgram(id.value)?.name,
  set: newName => setProgramName(id.value, newName),
})
const program = computed(() => getProgram(id.value))
const pluginId = computed(() => program.value?.pluginId)
const plugin = computed(() => {
  if (!pluginId.value)
    return null
  return pluginStore.getPlugin(pluginId.value)
})

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

    <program-setting
      v-if="pluginId"
      :key="pluginId"
      :program-id="id"
      :plugin-id="pluginId"
    />
  </n-form>
</template>
