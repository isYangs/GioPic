<script setup lang="ts">
const props = defineProps<{
  hasUploadableImages?: boolean
  isUpload?: boolean
  hasUrls?: boolean
  isAllPublic?: number
  defaultProgram?: number | null
  programs?: Array<{ label: string, value: number }>
  isPermissionSelectDisabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'uploadBatch'): void
  (e: 'clearAll'): void
  (e: 'copyAllUrls'): void
  (e: 'updateIsAllPublic', value: number): void
  (e: 'updateDefaultProgram', value: number | null): void
}>()

const isPublicOptions = [
  { label: '全部公开', value: 1 },
  { label: '全部私有', value: 0 },
]

const localIsUpload = ref(false)
const isClicking = ref(false)

watch(() => props.isUpload, (newVal) => {
  localIsUpload.value = newVal || false
})

onMounted(() => {
  localIsUpload.value = props.isUpload || false
})

function handleUploadClick(e: MouseEvent) {
  if (isClicking.value || localIsUpload.value) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  isClicking.value = true
  localIsUpload.value = true

  emit('uploadBatch')

  setTimeout(() => {
    isClicking.value = false
  }, 500)
}
</script>

<template>
  <div class="upload-toolbar">
    <div class="flex items-center gap-2">
      <n-button
        data-testid="upload-batch-button"
        type="primary"
        :loading="localIsUpload"
        :disabled="!hasUploadableImages || localIsUpload"
        @click="handleUploadClick"
      >
        {{ localIsUpload ? '上传中...' : '全部上传' }}
      </n-button>
      <n-button data-testid="copy-all-links-button" :disabled="!hasUrls" @click="$emit('copyAllUrls')">
        复制链接
      </n-button>
      <n-button data-testid="clear-all-images-button" type="error" secondary @click="$emit('clearAll')">
        清空
      </n-button>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="whitespace-nowrap text-sm text-primary">存储程序:</span>
        <n-select
          data-testid="default-program-select"
          :value="defaultProgram"
          class="min-w-30"
          :options="programs"
          placeholder="选择程序"
          @update:value="$emit('updateDefaultProgram', $event)"
        />
      </div>

      <div class="flex items-center gap-1.5">
        <span class="whitespace-nowrap text-sm text-primary">权限:</span>
        <n-tooltip
          v-if="isPermissionSelectDisabled"
          trigger="hover"
          placement="top"
        >
          <template #trigger>
            <n-select
              data-testid="permission-select"
              :value="isAllPublic"
              class="min-w-30"
              :options="isPublicOptions"
              :disabled="isPermissionSelectDisabled"
              @update:value="$emit('updateIsAllPublic', $event)"
            />
          </template>
          当前存储程序已禁用手动权限选择
        </n-tooltip>
        <n-select
          v-else
          data-testid="permission-select"
          :value="isAllPublic"
          class="min-w-30"
          :options="isPublicOptions"
          :disabled="isPermissionSelectDisabled"
          @update:value="$emit('updateIsAllPublic', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: var(--n-color);
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
</style>
