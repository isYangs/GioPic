<script setup lang="ts">
import type { StoragePlugin } from '@giopic/core'
import { pluginApi } from '~/api'
import { usePluginStore, useProgramStore } from '~/stores'

const emit = defineEmits<{
  close: []
}>()

const programStore = useProgramStore()
const pluginStore = usePluginStore()
const router = useRouter()

const isLoading = ref(true)
const plugins = ref<StoragePlugin[]>([])
const selectedPluginId = ref('')

const options = computed(() =>
  plugins.value.map(plugin => ({
    label: plugin.name,
    value: plugin.id,
    plugin,
  })),
)

const selectedPlugin = computed(() => plugins.value.find(p => p.id === selectedPluginId.value))

async function finishCreateProgram() {
  if (!selectedPlugin.value) {
    window.$message?.warning('请选择一个存储插件')
    return
  }

  try {
    const id = programStore.createProgram(selectedPlugin.value.type)

    const res = await pluginApi.getPluginSettingSchema(selectedPlugin.value.id)
    if (res.defaultValues) {
      programStore.setProgramDetail(id, res.defaultValues)
    }

    const program = programStore.getProgram(id)
    if (program) {
      program.pluginId = selectedPlugin.value.id
    }

    emit('close')
    router.push(`/Setting/${id}`)
  }
  catch (e) {
    console.error('创建存储程序失败:', e)
    window.$message?.error(`创建存储程序时出现错误`)
  }
}

onMounted(async () => {
  isLoading.value = true
  await pluginStore.loadPlugins()
  plugins.value = pluginStore.plugins

  if (plugins.value.length > 0) {
    selectedPluginId.value = plugins.value[0].id
  }

  isLoading.value = false
})
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center py-4">
    <n-spin size="medium" />
  </div>
  <template v-else-if="plugins.length > 0">
    <n-select v-model:value="selectedPluginId" class="mb6" :options="options" />
    <n-flex align="center" justify="end">
      <n-button type="primary" class="wfull" @click="finishCreateProgram()">
        创建
      </n-button>
    </n-flex>
  </template>
  <template v-else>
    <n-alert type="warning" title="没有可用的存储插件">
      <template #icon>
        <n-icon>
          <div i-ph-warning-circle />
        </n-icon>
      </template>
      <p>未找到任何存储插件，请先安装插件。</p>
      <div class="mt-4">
        <n-button type="primary" @click="$router.push('/Setting/Plugins')">
          管理插件
        </n-button>
      </div>
    </n-alert>
  </template>
</template>
