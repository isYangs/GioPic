<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'
import type { UploadCustomRequestOptions } from 'naive-ui'
import { useUploadDataStore } from '~/stores'

const uploadDataStore = useUploadDataStore()

// 上传文件，将文件信息存储到store中
async function handleUpload({ file, onFinish }: UploadCustomRequestOptions) {
  if (!file.file) {
    window.$message.error('文件不存在')
    return
  }

  const fileUrl = URL.createObjectURL(file.file)

  uploadDataStore.setData({
    fileInfo: { ...file },
    fileUrl,
    isLoading: false,
  })

  onFinish()
}
</script>

<template>
  <n-upload

    directory-dnd multiple
    auto-upload="false"
    :custom-request="handleUpload"
    accept="image/*"
    action=""
    :file-list-style="{ display: 'none' }"
  >
    <n-upload-dragger class="rounded-3">
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <ArchiveIcon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px">
        点击或者拖动文件到这里，支持上传多文件
      </n-text>
      <n-p depth="3" style="margin: 8px 0 0 0">
        禁止上传任何包含(色情，暴力，宣扬恐怖主义)及违反中华人民共和国法律的图片
      </n-p>
    </n-upload-dragger>
  </n-upload>
  <FileList />
</template>
