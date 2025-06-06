<script setup lang="ts">
defineProps<{
  isOverDropZone: boolean
  isProcessing: boolean
  hasFiles: boolean
}>()

defineEmits<{
  (e: 'selectFiles'): void
}>()
</script>

<template>
  <div class="upload-container">
    <div
      class="upload-area border-color-#e0e0e6 bg-#fafafc dark:border-color-#59595c dark:bg-#262629"
      :class="{
        'upload-area--drag-over': isOverDropZone,
        'opacity-60 cursor-not-allowed': isProcessing,
      }"
      @click="$emit('selectFiles')"
    >
      <div class="mb-3">
        <n-icon size="48" :depth="3" :class="{ 'animate-bounce': isOverDropZone }">
          <icon-svg />
        </n-icon>
      </div>
      <n-text class="text-4">
        {{
          isProcessing ? '正在处理文件...'
          : isOverDropZone ? '释放文件以上传'
            : '点击选择文件或拖拽到此处'
        }}
      </n-text>
      <n-p depth="3" class="mt-2">
        支持拖拽上传文件或文件夹，也可直接粘贴图片
      </n-p>
      <n-p depth="3" class="mt-1 text-xs">
        支持所有图片格式 (JPG、PNG、GIF、WebP、BMP、SVG、TIFF、AVIF、HEIC、RAW等)
      </n-p>
    </div>
  </div>
</template>

<style scoped>
.upload-area {
  border-width: 1px;
  border-style: dashed;
  border-radius: 8px;
  padding: 20px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-area--drag-over {
  border-color: var(--primary-color) !important;
}

.upload-area:hover:not(.opacity-60) {
  border-color: var(--primary-color) !important;
}

.upload-container {
  margin-bottom: 16px;
}
</style>
