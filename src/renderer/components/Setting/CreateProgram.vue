<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()

const programStore = useProgramStore()
const pluginStore = usePluginStore()
const router = useRouter()

const isLoading = ref(true)
const activeTab = ref('plugin')

const plugins = computed(() => pluginStore.plugins.filter(p => p.enabled !== false))
const selectedPluginId = ref('')
const pluginOptions = computed(() =>
  plugins.value.map(p => ({ label: p.name, value: p.id })),
)

interface Preset {
  id: string
  name: string
  description: string
  pluginId: string
  type: string
  detail: Record<string, any>
}

const presets: Preset[] = [
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Amazon Web Services S3 对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'us-east-1',
      endpoint: '',
      forcePathStyle: false,
      acl: 'public-read',
    },
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    description: 'Cloudflare R2 对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'auto',
      forcePathStyle: false,
      acl: '',
    },
  },
  {
    id: 'backblaze-b2',
    name: 'Backblaze B2',
    description: 'Backblaze B2 Cloud Storage',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'us-west-004',
      endpoint: 's3.us-west-004.backblazeb2.com',
      forcePathStyle: false,
      acl: '',
    },
  },
  {
    id: 'aliyun-oss',
    name: '阿里云 OSS',
    description: 'Alibaba Cloud OSS 对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'oss-cn-hangzhou',
      endpoint: 'oss-cn-hangzhou.aliyuncs.com',
      forcePathStyle: false,
      acl: '',
    },
  },
  {
    id: 'tencent-cos',
    name: '腾讯云 COS',
    description: 'Tencent Cloud COS 对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'ap-guangzhou',
      endpoint: 'cos.ap-guangzhou.myqcloud.com',
      forcePathStyle: false,
      acl: '',
    },
  },
  {
    id: 'qiniu-kodo',
    name: '七牛云 Kodo',
    description: '七牛云对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'cn-east-1',
      endpoint: 's3-cn-east-1.qiniucs.com',
      forcePathStyle: false,
      acl: '',
    },
  },
  {
    id: 'minio',
    name: 'MinIO',
    description: '自建 MinIO 对象存储',
    pluginId: 'giopic-s3',
    type: 'giopic-s3',
    detail: {
      region: 'us-east-1',
      endpoint: '',
      forcePathStyle: true,
      acl: '',
    },
  },
]

const availablePresets = computed(() =>
  presets.filter(preset => plugins.value.some(p => p.id === preset.pluginId)),
)

async function createFromPlugin() {
  const plugin = plugins.value.find(p => p.id === selectedPluginId.value)
  if (!plugin) {
    window.$message.warning('请选择一个存储插件')
    return
  }

  const id = programStore.createProgram(plugin.type)

  const settingSchema = await window.ipcRenderer.invoke('get-plugin-setting-schema', plugin.id)
  if (settingSchema?.defaultValues) {
    programStore.setProgramDetail(id, settingSchema.defaultValues)
  }

  const program = programStore.getProgram(id)
  if (program) {
    program.pluginId = plugin.id
  }

  emit('close')
  router.push(`/Setting/${id}`)
}

async function createFromPreset(preset: Preset) {
  const id = programStore.createProgram(preset.type)

  const settingSchema = await window.ipcRenderer.invoke('get-plugin-setting-schema', preset.pluginId)
  const defaultValues = settingSchema?.defaultValues || {}

  programStore.setProgramDetail(id, { ...defaultValues, ...preset.detail })

  const program = programStore.getProgram(id)
  if (program) {
    program.pluginId = preset.pluginId
    program.name = preset.name
  }

  emit('close')
  router.push(`/Setting/${id}`)
}

async function importFromFile() {
  try {
    const data = await window.ipcRenderer.invoke('import-program-config')
    if (!data)
      return

    if (!data.type || !data.pluginId || !data.detail) {
      window.$message.error('配置文件格式不正确')
      return
    }

    const plugin = plugins.value.find(p => p.id === data.pluginId)
    if (!plugin) {
      const allPlugins = pluginStore.plugins
      const disabledPlugin = allPlugins.find(p => p.id === data.pluginId)
      if (disabledPlugin) {
        window.$message.error(`插件「${disabledPlugin.name}」已禁用，请先启用`)
      }
      else {
        window.$message.error(`需要插件「${data.pluginId}」，请先安装`)
      }
      return
    }

    const id = programStore.createProgram(data.type)
    programStore.setProgramDetail(id, data.detail)

    const program = programStore.getProgram(id)
    if (program) {
      program.pluginId = data.pluginId
      if (data.name)
        program.name = data.name
      if (typeof data.icon === 'string') {
        program.icon = data.icon
      }
    }

    window.$message.success('导入成功')
    emit('close')
    router.push(`/Setting/${id}`)
  }
  catch (e: any) {
    window.$message.error(e?.message || '导入失败')
  }
}

onMounted(async () => {
  isLoading.value = true
  await pluginStore.reloadPlugins()
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
  <template v-else>
    <n-tabs v-model:value="activeTab" type="segment" animated class="mb-1">
      <n-tab-pane name="plugin" tab="选择插件">
        <template v-if="plugins.length > 0">
          <n-select v-model:value="selectedPluginId" class="mb-4" :options="pluginOptions" />
          <n-button type="primary" class="w-full" @click="createFromPlugin">
            创建
          </n-button>
        </template>
        <n-alert v-else type="warning" title="没有可用的存储插件">
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
      </n-tab-pane>

      <n-tab-pane name="preset" tab="从预设">
        <div v-if="availablePresets.length > 0" class="flex flex-col gap-2">
          <div
            v-for="preset in availablePresets"
            :key="preset.id"
            class="group flex cursor-pointer items-center gap-3 border border-gray-200/60 rounded-lg bg-white px-3.5 py-3 transition-all dark:border-white/8 hover:border-primary/40 dark:bg-white/5 hover:shadow-sm dark:hover:border-primary/30"
            @click="createFromPreset(preset)"
          >
            <div class="h-8 w-8 flex flex-shrink-0 items-center justify-center rounded-lg bg-gray-100/80 dark:bg-white/8">
              <div i-ph-cloud class="text-base op-60" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium">
                {{ preset.name }}
              </div>
              <div class="mt-0.5 truncate text-xs op-45">
                {{ preset.description }}
              </div>
            </div>
            <div i-ph-caret-right class="flex-shrink-0 text-xs op-0 transition-opacity group-hover:op-40" />
          </div>
        </div>
        <n-empty v-else description="暂无可用预设" class="py-6">
          <template #extra>
            <p class="text-xs op-45">
              请先安装支持预设的插件（如 S3 插件）
            </p>
          </template>
        </n-empty>
      </n-tab-pane>

      <n-tab-pane name="import" tab="从文件导入">
        <div class="flex flex-col items-center gap-4 py-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100/80 dark:bg-white/5">
            <div i-ph-file-arrow-down class="text-3xl op-40" />
          </div>
          <div class="text-center">
            <p class="text-sm op-70">
              导入之前导出的存储配置文件
            </p>
            <p class="mt-1 text-xs op-40">
              支持 .json 格式的配置文件
            </p>
          </div>
          <n-button type="primary" @click="importFromFile">
            <template #icon>
              <div i-ph-folder-open />
            </template>
            选择文件
          </n-button>
        </div>
      </n-tab-pane>
    </n-tabs>
  </template>
</template>
