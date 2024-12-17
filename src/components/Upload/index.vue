<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui'
import { useUploadDataStore } from '~/stores'

const uploadDataStore = useUploadDataStore()

// 上传文件，将文件信息存储到store中
async function upload({ file, onFinish }: UploadCustomRequestOptions) {
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

// 监听粘贴事件，将粘贴的图片文件存储到store中
useEventListener('paste', async (e) => {
  const items = e.clipboardData?.items
  if (!items)
    return

  let file: File | null = null
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      file = items[i].getAsFile()
      break
    }
  }
  if (!file)
    return

  const blob = new Blob([file], { type: file.type })
  const fileUrl = URL.createObjectURL(blob)

  uploadDataStore.setData({
    fileInfo: {
      file,
      id: file.name,
      name: file.name,
      status: 'pending',
    },
    fileUrl,
    isLoading: false,
  })
})
</script>

<template>
  <n-upload
    directory-dnd multiple
    auto-upload="false"
    :custom-request="upload"
    accept="image/*"
    action=""
    :file-list-style="{ display: 'none' }"
  >
    <n-upload-dragger class="rounded-3">
      <div class="mb-3">
        <n-icon size="48" :depth="3">
          <IconSVG />
        </n-icon>
      </div>
      <n-text class="text-4">
        点击或者拖动文件到这里，支持上传多文件
      </n-text>
      <n-p depth="3" class="mt-2">
        禁止上传任何包含(色情，暴力，宣扬恐怖主义)及违反中华人民共和国法律的图片
      </n-p>
    </n-upload-dragger>
  </n-upload>
  <FileList />
</template>
