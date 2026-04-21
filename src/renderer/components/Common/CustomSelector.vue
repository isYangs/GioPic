<script setup lang="ts">
interface Props {
  modelValue: string | number | Array<string | number> | null
  pluginId: string
  customMethod: string
  config: Record<string, any>
  field: string
  multiple?: boolean
  placeholder?: string
  label?: string
  dataKey?: string
  labelField?: string
  valueField?: string
  labelFormat?: string
  transformer?: (item: any) => { label: string, value: any }
  programId?: number
}

interface Emits {
  (e: 'update:modelValue', value: string | number | Array<string | number> | null): void
}

const props = withDefaults(defineProps<Props>(), {
  dataKey: '',
  labelField: 'name',
  valueField: 'id',
  labelFormat: '{name} (ID: {id})',
})

const emit = defineEmits<Emits>()

const pluginDataStore = usePluginDataStore()
const options = ref<Array<{ label: string, value: any }>>([])

const value = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const maxTagCount = computed(() => {
  if (!props.multiple)
    return undefined

  const selectedCount = Array.isArray(props.modelValue) ? props.modelValue.length : 0

  if (selectedCount <= 2)
    return undefined
  if (selectedCount <= 5)
    return 2
  return 1
})

const actualDataKey = computed(() => {
  const baseKey = props.dataKey || `${props.field}Options`

  if (props.programId) {
    return `program-${props.programId}-${baseKey}`
  }
  else if (props.config.api) {
    const apiKey = props.config.api.replace(/[^a-z0-9]/gi, '_').substring(0, 20)
    return `api-${apiKey}-${baseKey}`
  }

  return baseKey
})

function getPluginRawData(key: string) {
  return pluginDataStore.getData(props.pluginId, key)
}

const hasCachedData = computed(() => {
  const cachedOptions = getPluginRawData(actualDataKey.value)
  return cachedOptions && Array.isArray(cachedOptions) && cachedOptions.length > 0
})

function formatItem(item: any): { label: string, value: any, raw?: any } {
  if (props.transformer) {
    return props.transformer(item)
  }

  const value = item[props.valueField]

  let label = props.labelFormat

  const placeholderRegex = /\{(\w+)\}/g
  label = label.replace(placeholderRegex, (match, fieldName) => {
    return item[fieldName] ?? match
  })

  return { label, value, raw: item }
}

function generateOptionsFromCache() {
  const cachedData = getPluginRawData(actualDataKey.value)
  if (cachedData && Array.isArray(cachedData)) {
    return cachedData.map(formatItem)
  }
  return []
}

async function loadCachedOptions() {
  await syncPluginDataFromMain(props.pluginId)

  const cachedOptions = generateOptionsFromCache()
  if (cachedOptions.length > 0) {
    options.value = cachedOptions
    return true
  }
  return false
}

async function fetchOptions() {
  const result = await callIpc('call-plugin-custom-method', {
    pluginId: props.pluginId,
    methodName: props.customMethod,
    params: {
      api: props.config.api,
      token: props.config.token,
      programId: props.programId,
    },
  })

  let newOptions: Array<{ label: string, value: any }> = []

  if (result && typeof result === 'object' && 'options' in result) {
    newOptions = (result as any).options || []
  }
  else if (Array.isArray(result)) {
    newOptions = result
  }

  options.value = newOptions

  await syncPluginDataFromMain(props.pluginId)

  getPluginRawData(actualDataKey.value)

  window.$message.success(`获取${props.label || '选项'}成功`)
}

onMounted(async () => {
  await loadCachedOptions()
  console.warn(`CustomSelector mounted - field: ${props.field}, multiple: ${props.multiple}, pluginId: ${props.pluginId}`)
})

defineExpose({
  getPluginRawData,
  hasCachedData,
  loadCachedOptions,
  fetchOptions,
  actualDataKey,
  formatItem,
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <n-select
        v-model:value="value"
        :options="options"
        :multiple="multiple"
        :placeholder="placeholder || `请先获取${label || '选项'}`"
        :disabled="options.length === 0"
        :max-tag-count="maxTagCount"
        :show-arrow="true"
        :ellipsis-tag-popover-props="{ trigger: 'hover' }"
        check-strategy="child"
        clearable
        filterable
        class="min-w-0 flex-1"
        style="min-width: 260px;"
      />
      <n-button strong secondary @click="fetchOptions">
        <template #icon>
          <div i-ph-arrow-counter-clockwise-bold />
        </template>
      </n-button>
    </div>
  </div>
</template>
