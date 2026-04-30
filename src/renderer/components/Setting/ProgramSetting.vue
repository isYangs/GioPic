<script setup lang="ts">
import type { SettingItem, SettingSchema } from '@giopic/core'

const props = defineProps<{
  programId: number
  pluginId: string
  instanceId?: string
}>()

const programStore = useProgramStore()
const id = computed(() => props.programId)

const settings = ref<SettingItem[]>([])
const isLoading = ref(true)

const setting = computed({
  get: () => programStore.getProgram(id.value).detail,
  set: val => programStore.setProgramDetail(id.value, val),
})

async function initializeSettings() {
  const settingSchema = await callIpc<SettingSchema>('get-plugin-setting-schema', props.pluginId)
  settings.value = settingSchema?.items || []

  if (settingSchema?.defaultValues) {
    const program = programStore.getProgram(id.value)
    const hasExistingConfig = Object.keys(program.detail).length > 0

    if (!hasExistingConfig) {
      setting.value = { ...settingSchema.defaultValues }
    }
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
