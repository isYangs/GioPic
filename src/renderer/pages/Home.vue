<script setup lang="ts">
import { debounce } from 'radash'
import { pluginApi } from '~/api'
import { useDragAndDrop } from '~/composables/useDragAndDrop'
import { useFileProcessor } from '~/composables/useFileProcessor'
import { useImageUpload } from '~/composables/useImageUpload'
import { usePasteUpload } from '~/composables/usePasteUpload'
import { useAppStore, useProgramStore, useUploadDataStore } from '~/stores'

definePage({
  name: 'Home',
  path: '/',
})

// Store管理
const appStore = useAppStore()
const programStore = useProgramStore()
const uploadDataStore = useUploadDataStore()
const { defaultProgram } = storeToRefs(appStore)
const { data } = storeToRefs(uploadDataStore)

// 页面状态
const dropZone = useTemplateRef('dropZoneRef')
const isProcessing = ref(false)
const isAllPublic = ref(1)
const isResetting = ref(false)
const isPermissionSelectDisabled = ref(false)

// 计算属性
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

// 程序验证
if (!isProgramValid.value) {
  defaultProgram.value = null
}

// 上传功能
const { isUpload, uploadSingleImage, uploadBatchImages } = useImageUpload({
  isAllPublic,
  defaultProgram,
})

// 文件处理
const { processFiles } = useFileProcessor({
  onProcessStart: () => { isProcessing.value = true },
  onProcessEnd: () => { isProcessing.value = false },
  onSuccess: (count: number) => window.$message.success(`成功添加 ${count} 个图片文件`),
  onError: (e: string) => window.$message.error(e),
  onWarning: (message: string) => window.$message.warning(message),
})

// 文件上传处理
async function processUploadFiles(files: File[] | FileList | null) {
  if (!files || isProcessing.value)
    return
  await processFiles(files, uploadDataStore)
}

// 拖拽功能
const { isOverDropZone, setupDragAndDrop } = useDragAndDrop({
  onDrop: processUploadFiles,
  onError: (message: string) => window.$message.warning(message),
})

// 粘贴功能
usePasteUpload({
  onPaste: processUploadFiles,
})

// 文件选择对话框
const { open: openFileDialog, onChange } = useFileDialog({
  accept: 'image/*',
  multiple: true,
})

onChange(processUploadFiles)

// 业务逻辑函数
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

// 防抖批量上传
const debouncedBatchUpload = debounce({ delay: 300 }, async () => {
  if (isUpload.value) {
    window.$message.info('上传正在进行中，请稍候...')
    return
  }
  await uploadBatchImages()
})

// 权限检查
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

  try {
    let cleanConfig
    try {
      cleanConfig = JSON.parse(JSON.stringify(program.detail))
    }
    catch {
      cleanConfig = {}
    }

    const res = await pluginApi.shouldDisablePermissionSelect(program.pluginId, cleanConfig)
    isPermissionSelectDisabled.value = res
  }
  catch (e) {
    console.error('检查权限禁用状态失败:', e)
    isPermissionSelectDisabled.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  const element = dropZone.value
  if (element) {
    setupDragAndDrop(element)
  }
  checkPermissionSelectDisabled()
})

// 监听器
watch(defaultProgram, () => {
  checkPermissionSelectDisabled()
})

// 监听快捷键上传
window.ipcRenderer.on('upload-shortcut', () => {
  debouncedBatchUpload()
})
</script>

<template>
  <div ref="dropZoneRef" class="h-full flex flex-col overflow-hidden">
    <!-- 上传区域 -->
    <div class="flex-shrink-0">
      <upload-area
        :is-processing="isProcessing"
        :is-over-drop-zone="isOverDropZone"
        :has-files="data.length > 0"
        @select-files="selectFiles"
      />
    </div>

    <!-- 图片列表和控制区域 -->
    <template v-if="data.length">
      <upload-controls
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
        @remove-image="removeImage"
        @upload-single="uploadSingleImage"
      />
    </template>
  </div>
</template>
