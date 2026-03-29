<script setup lang="ts">
import { getLinkTypeOptions } from '~/utils/main'

const props = defineProps<{
  index: number
}>()

const emit = defineEmits<{
  (e: 'remove', index: number): void
  (e: 'upload', index: number): void
}>()

const uploadDataStore = useUploadDataStore()
const { data } = storeToRefs(uploadDataStore)

const file = computed(() => data.value[props.index])

const fileSize = computed(() => {
  if (!file.value?.file?.size)
    return ''
  const size = file.value.file.size
  if (size < 1024)
    return `${size}B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)}KB`
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
})

// 获取图片尺寸信息
const imageDimensions = computed(() => {
  if (!file.value?.metadata?.width || !file.value?.metadata?.height)
    return ''
  return `${file.value.metadata.width}×${file.value.metadata.height}`
})

// 获取图片格式
const imageFormat = computed(() => {
  if (file.value?.metadata?.format) {
    return file.value.metadata.format.toUpperCase()
  }
  if (file.value?.file?.type) {
    return file.value.file.type.split('/')[1]?.toUpperCase()
  }
  return ''
})

const status = computed(() => {
  if (!file.value)
    return 'pending'
  if (file.value.isLoading)
    return 'uploading'
  if (file.value.uploaded && file.value.url)
    return 'success'
  if (file.value.uploadFailed)
    return 'error'
  return 'pending'
})

// 删除图片
function removeImage(index: number) {
  emit('remove', index)
}

function copyImageLink(type: string, url: string, name: string) {
  const link = generateLink(type, url, name)
  navigator.clipboard
    .writeText(link)
    .then(() => window.$message.success('复制成功'))
    .catch(() => window.$message.error('复制失败'))
}

function getTagType(status: string) {
  switch (status) {
    case 'pending':
      return 'default'
    case 'uploading':
      return 'warning'
    case 'success':
      return 'primary'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return '待上传'
    case 'uploading':
      return '上传中'
    case 'success':
      return '已完成'
    case 'error':
      return '失败'
    default:
      return '未知'
  }
}
</script>

<template>
  <n-card
    class="upload-card mb-2 rounded-2"
    content-class="!p-3 flex items-center gap-3"
  >
    <div class="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
      <n-image
        v-if="file?.thumbnail"
        :src="file.thumbnail"
        :alt="file?.name || '图片预览'"
        preview-disabled
        class="wh-full"
        object-fit="cover"
      />

      <div v-if="status === 'uploading'" class="upload-mask">
        <div i-ph-circle-notch class="h-4 w-4 animate-spin text-white" />
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="mb-0.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <n-ellipsis class="flex text-sm text-primary font-500 !max-w-60">
            {{ file?.name || '未知文件' }}
          </n-ellipsis>

          <n-space size="small">
            <n-tag v-if="fileSize" size="small" type="info" :bordered="false">
              {{ fileSize }}
            </n-tag>
            <n-tag v-if="imageDimensions" size="small" type="info" :bordered="false">
              {{ imageDimensions }}
            </n-tag>
            <n-tag v-if="imageFormat" size="small" type="info" :bordered="false">
              {{ imageFormat }}
            </n-tag>
          </n-space>
        </div>

        <n-tag
          :type="getTagType(status)"
          size="small"
          :bordered="false"
        >
          <template #icon>
            <div
              :class="{
                'i-ph-clock': status === 'pending',
                'i-ph-circle-notch animate-spin': status === 'uploading',
                'i-ph-check': status === 'success',
                'i-ph-x': status === 'error',
              }"
            />
          </template>
          {{ getStatusText(status) }}
        </n-tag>
      </div>
    </div>

    <n-space size="small" class="flex-shrink-0">
      <template v-if="status === 'success'">
        <n-dropdown
          trigger="click"
          :options="getLinkTypeOptions()"
          @select="(type) => copyImageLink(type, file.url!, file.origin_name!)"
        >
          <n-button size="small" type="primary" quaternary>
            <template #icon>
              <div i-ph-copy />
            </template>
          </n-button>
        </n-dropdown>
      </template>

      <template v-else-if="status === 'error'">
        <n-button
          size="small"
          type="warning"
          quaternary
          @click="$emit('upload', index)"
        >
          <template #icon>
            <div i-ph-arrow-clockwise />
          </template>
        </n-button>
      </template>

      <template v-else-if="status === 'pending'">
        <n-button
          size="small"
          type="primary"
          quaternary
          :disabled="!file?.file && !file?.buffer"
          @click="$emit('upload', index)"
        >
          <template #icon>
            <div i-ph-upload-simple />
          </template>
        </n-button>
      </template>

      <n-button
        size="small"
        type="error"
        quaternary
        :disabled="status === 'uploading'"
        @click="removeImage(index)"
      >
        <template #icon>
          <div i-ic-round-close />
        </template>
      </n-button>
    </n-space>
  </n-card>
</template>

<style scoped>
.upload-card {
  transition: all 0.2s ease;
}

.upload-card:hover {
  background: var(--n-color-embedded);
  border-color: var(--n-color-target);
}

.n-image :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
