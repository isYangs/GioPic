<script setup lang="ts">
import type { SettingItem } from '@giopic/core'
import { pluginApi } from '~/api'
import { useProgramStore } from '~/stores'

const props = defineProps<{
  programId: number
  pluginId: string
  instanceId?: string
}>()

const programStore = useProgramStore()
const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))

const settings = ref<SettingItem[]>([])
const isLoading = ref(true)

const setting = computed({
  get: () => programStore.getProgram(id.value).detail,
  set: val => programStore.setProgramDetail(id.value, val),
})

async function initializeSettings() {
  try {
    const res = await pluginApi.getPluginSettingSchema(props.pluginId)
    settings.value = res.items || []

    if (res.defaultValues) {
      const program = programStore.getProgram(id.value)
      const hasExistingConfig = Object.keys(program.detail).length > 0

      if (!hasExistingConfig) {
        setting.value = { ...res.defaultValues }
      }
    }
  }
  catch (e) {
    console.error('加载插件设置失败:', e)
    window.$message.error('加载插件设置失败')
  }
}

onMounted(async () => {
  isLoading.value = true
  await initializeSettings()
  isLoading.value = false
})
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center py-4">
    <n-spin size="medium" />
  </div>
  <template v-else>
    <plugin-config-form
      v-model="setting"
      :setting-items="settings"
      :plugin-id="pluginId"
      :program-id="programId"
    />
  </template>
</template>
