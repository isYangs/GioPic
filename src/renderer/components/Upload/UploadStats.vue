<script setup lang="ts">
import { convertFileSize } from '~/utils/main'

const uploadDataStore = useUploadDataStore()
const { data } = storeToRefs(uploadDataStore)

const uploadStats = computed(() => {
  const total = data.value.length
  const pending = data.value.filter(item => !item.url && !item.uploadFailed && !item.uploaded && !item.isLoading).length
  const uploading = data.value.filter(item => item.isLoading).length
  const success = data.value.filter(item => item.uploaded && item.url).length
  const failed = data.value.filter(item => item.uploadFailed).length

  const totalSize = data.value.reduce((acc, item) => {
    const size = item.file?.size || item.size || 0
    return acc + size
  }, 0)

  return {
    total,
    pending,
    uploading,
    success,
    failed,
    totalSize,
  }
})
</script>

<template>
  <div v-if="uploadStats.total > 0" class="upload-stats">
    <div class="stats-header">
      <span class="text-sm text-primary font-medium">上传统计</span>
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2 py-0.75">
        <span class="stats-label flex-1 text-xs text-primary">总计</span>
        <span class="text-xs text-primary font-medium">{{ uploadStats.total }}</span>
      </div>

      <div class="flex items-center gap-2 py-0.75">
        <span class="flex-1 text-xs text-primary">总大小</span>
        <span class="text-xs text-primary font-medium">{{ convertFileSize(uploadStats.totalSize) }}</span>
      </div>

      <div v-if="uploadStats.pending > 0" class="flex items-center gap-2 py-0.75">
        <span class="flex-1 text-xs text-primary">待上传</span>
        <span class="text-xs text-primary font-medium">{{ uploadStats.pending }}</span>
      </div>

      <div v-if="uploadStats.uploading > 0" class="flex items-center gap-2 py-0.75">
        <span class="flex-1 text-xs text-primary">上传中</span>
        <span class="text-xs text-primary font-medium">{{ uploadStats.uploading }}</span>
      </div>

      <div v-if="uploadStats.success > 0" class="flex items-center gap-2 py-0.75">
        <span class="flex-1 text-xs text-primary">已完成</span>
        <span class="text-xs text-primary font-medium">{{ uploadStats.success }}</span>
      </div>

      <div v-if="uploadStats.failed > 0" class="flex items-center gap-2 py-0.75">
        <span class="flex-1 text-xs text-primary">失败</span>
        <span class="text-xs text-primary font-medium">{{ uploadStats.failed }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-stats {
  margin: 12px;
  padding: 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  font-size: 13px;
  transform-origin: bottom;
  overflow: hidden;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--n-border-color);
}
</style>
