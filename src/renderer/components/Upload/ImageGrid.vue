<script setup lang="ts">
import { useUploadDataStore } from '~/stores'

defineEmits<{
  (e: 'removeImage', index: number): void
  (e: 'uploadSingle', index: number): void
}>()
const uploadDataStore = useUploadDataStore()
const { data } = storeToRefs(uploadDataStore)
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <n-image-group>
      <image-card
        v-for="(file, index) in data"
        :key="file.id || index"
        :index="index"
        @remove="$emit('removeImage', $event)"
        @upload="$emit('uploadSingle', $event)"
      />
    </n-image-group>

    <div
      v-if="data.length === 0"
      class="h-full min-h-120px flex flex-col items-center justify-center text-[var(--n-text-color-disabled)]"
    >
      <div class="mb-1.5 h-6 w-6 opacity-50" i-ph-files />
      <span class="text-sm">暂无文件</span>
    </div>
  </div>
</template>
