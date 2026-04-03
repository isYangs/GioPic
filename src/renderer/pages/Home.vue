<script setup lang="ts">
import { debounce } from 'radash'
import { useDragAndDrop } from '~/composables/useDragAndDrop'
import { useFileProcessor } from '~/composables/useFileProcessor'
import { useImageUpload } from '~/composables/useImageUpload'
import { usePasteUpload } from '~/composables/usePasteUpload'
import { useAppStore, useProgramStore, useUploadDataStore } from '~/stores'

definePage({
  name: 'Home',
  path: '/',
})

const appStore = useAppStore()
const programStore = useProgramStore()
const uploadDataStore = useUploadDataStore()
const { defaultProgram } = storeToRefs(appStore)
const { data } = storeToRefs(uploadDataStore)

const dropZone = useTemplateRef('dropZoneRef')
const isProcessing = ref(false)
const isAllPublic = ref(1)
const isResetting = ref(false)
const isPermissionSelectDisabled = ref(false)

const programs = computed(() =>
  programStore.getProgramList()
    .filter(p => p.value !== null)
    .map(p => ({ ...p, value: p.value as number })),
)
const isProgramValid = computed(() => {
  return defaultProgram.value && programStore.getProgram(defaultProgram.value)?.id
})
const hasUploadableImages = computed(() => {
  return data.value.some(item => !item.url && !item.uploadFailed && !item.uploaded)
})
const hasUrls = computed(() => {
  return data.value.some(item => item?.url)
})

if (!isProgramValid.value) {
  defaultProgram.value = null
}

const { isUpload, uploadSingleImage, uploadBatchImages } = useImageUpload({
  isAllPublic,
  defaultProgram,
})

const { processFiles } = useFileProcessor()

async function processUploadFiles(files: File[] | FileList | null) {
  if (!files || isProcessing.value)
    return

  isProcessing.value = true
  try {
    const count = await processFiles(files, uploadDataStore)
    window.$message.success(`成功处理 ${count} 张图片`)
  }
  finally {
    isProcessing.value = false
  }
}

const { isOverDropZone, onDragEnter, onDragOver, onDragLeave, onDrop } = useDragAndDrop()

const isPageActive = ref(true)

usePasteUpload({
  onPaste: processUploadFiles,
  enabled: isPageActive,
})

// 文件选择对话框
const { open: openFileDialog, onChange } = useFileDialog({
  accept: 'image/*',
  multiple: true,
})

onChange(processUploadFiles)

function selectFiles() {
  if (!isProcessing.value) {
    openFileDialog()
  }
}

function resetUploadState() {
  if (isResetting.value)
    return

  isResetting.value = true

  try {
    const newData = data.value.map(item => ({
      isLoading: item.isLoading || false,
      file: item.file,
      buffer: item.buffer,
      name: item.name,
      id: item.id,
      thumbnail: item.thumbnail,
      metadata: item.metadata,
      origin_name: item.origin_name,
      uploaded: false,
      uploadFailed: false,
    }))
    uploadDataStore.$state.data = newData
  }
  finally {
    isResetting.value = false
  }
}

function removeImage(index: number) {
  uploadDataStore.delData(index)
}

function clearAllImages() {
  uploadDataStore.delData()
}

function copyAllUrls() {
  const urlList = data.value
    .map(item => item?.url)
    .filter(Boolean)

  if (!urlList.length) {
    window.$message.info('没有可以复制的图片链接')
    return
  }

  const url = urlList.join('\n')

  navigator.clipboard
    .writeText(url)
    .then(() => window.$message.success('复制成功'))
    .catch(() => window.$message.error('复制失败'))
}

function updateIsAllPublic(value: number) {
  isAllPublic.value = value
}

function updateDefaultProgram(value: number | null) {
  defaultProgram.value = value
  resetUploadState()
  checkPermissionSelectDisabled()
}

const debouncedBatchUpload = debounce({ delay: 300 }, async () => {
  if (isUpload.value) {
    window.$message.info('上传正在进行中，请稍候...')
    return
  }
  await uploadBatchImages()
})

async function checkPermissionSelectDisabled() {
  if (!defaultProgram.value) {
    isPermissionSelectDisabled.value = false
    return
  }

  const program = programStore.getProgram(defaultProgram.value)
  if (!program || !program.pluginId) {
    isPermissionSelectDisabled.value = false
    return
  }

  const cleanConfig = program.detail ? JSON.parse(JSON.stringify(program.detail)) : {}

  const permissionSelectStatus = await window.ipcRenderer.invoke('should-disable-permission-select', { pluginId: program.pluginId, config: cleanConfig })
  isPermissionSelectDisabled.value = Boolean(permissionSelectStatus)
}

// 处理拖拽放置
async function handleDrop(e: DragEvent) {
  const files = await onDrop(e)
  await processUploadFiles(files)
}

onMounted(() => {
  const element = dropZone.value
  if (element) {
    element.addEventListener('dragenter', onDragEnter)
    element.addEventListener('dragover', onDragOver)
    element.addEventListener('dragleave', onDragLeave)
    element.addEventListener('drop', handleDrop)

    onUnmounted(() => {
      element.removeEventListener('dragenter', onDragEnter)
      element.removeEventListener('dragover', onDragOver)
      element.removeEventListener('dragleave', onDragLeave)
      element.removeEventListener('drop', handleDrop)
    })
  }
  checkPermissionSelectDisabled()
})

watch(defaultProgram, () => {
  checkPermissionSelectDisabled()
})

const uploadShortcutHandler = () => debouncedBatchUpload()
window.ipcRenderer.on('upload-shortcut', uploadShortcutHandler)

onActivated(() => {
  isPageActive.value = true
})

onDeactivated(() => {
  isPageActive.value = false
})

onUnmounted(() => {
  window.ipcRenderer.off('upload-shortcut', uploadShortcutHandler)
})

async function handleSingleImageUpload(index: number) {
  await uploadSingleImage(index)
}
</script>

<template>
  <div ref="dropZoneRef" class="h-full flex flex-col overflow-hidden" data-testid="home-page">
    <div class="flex-shrink-0">
      <upload-area
        data-testid="upload-area"
        :is-processing="isProcessing"
        :is-over-drop-zone="isOverDropZone"
        :has-files="data.length > 0"
        @select-files="selectFiles"
      />
    </div>

    <template v-if="data.length">
      <upload-controls
        data-testid="upload-controls"
        :has-uploadable-images="hasUploadableImages"
        :is-upload="isUpload"
        :has-urls="hasUrls"
        :is-all-public="isAllPublic"
        :default-program="defaultProgram"
        :programs="programs"
        :is-permission-select-disabled="isPermissionSelectDisabled"
        @upload-batch="debouncedBatchUpload"
        @clear-all="clearAllImages"
        @copy-all-urls="copyAllUrls"
        @update-is-all-public="updateIsAllPublic"
        @update-default-program="updateDefaultProgram"
      />

      <image-grid
        data-testid="upload-grid"
        @remove-image="removeImage"
        @upload-single="handleSingleImageUpload"
      />
    </template>
  </div>
</template>
