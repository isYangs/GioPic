<script setup lang="ts">
import type { ProgramDetail } from '@/types'
import { NButton, NCheckbox } from 'naive-ui'
import pLimit from 'p-limit'
import { apiClient } from '~/api'
import { useAppStore, useProgramStore, useUploadDataStore } from '~/stores'
import debounce from '~/utils/debounce'
import { generateLink, getLinkTypeOptions } from '~/utils/main'

const appStore = useAppStore()
const programStore = useProgramStore()
const uploadDataStore = useUploadDataStore()
const { defaultProgram, isImgListDelDialog } = storeToRefs(appStore)
const { data } = storeToRefs(uploadDataStore)

const isAllPublic = ref(1)
const isUpload = ref(false)
const isResetting = ref(false)
const isPublicOptions = [
  { label: '全部公开', value: 1 },
  { label: '全部私有', value: 0 },
]

const hasPresetAcl = computed(() => {
  if (!defaultProgram.value)
    return false
  const program = programStore.getProgram(defaultProgram.value)
  return Boolean(program.type === 's3' && (program.detail as ProgramDetail['s3']).acl)
})

const programs = computed(() => programStore.getProgramList())

const isProgramValid = computed(() => {
  return defaultProgram.value && programStore.getProgram(defaultProgram.value)?.id
})

if (!isProgramValid.value) {
  defaultProgram.value = null
}

const hasUploadableImages = computed(() => {
  return data.value.some(item => !item.url && !item.uploadFailed && !item.uploaded)
})

function resetUploadState() {
  if (isResetting.value)
    return

  isResetting.value = true

  try {
    const newData = data.value.map(item => ({
      isLoading: item.isLoading || false,
      fileUrl: item.fileUrl,
      fileInfo: item.fileInfo,
    }))
    uploadDataStore.$state.data = newData
  }
  finally {
    isResetting.value = false
  }
}

async function uploadImage(index: number, file: File, isGetRecord = true) {
  if (!defaultProgram.value) {
    window.$message.error('请选择存储程序后再上传')
    return
  }

  if (data.value[index].uploaded) {
    window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
    return
  }

  uploadDataStore.setData({ isLoading: true }, index)

  try {
    const program = programStore.getProgram(defaultProgram.value)
    const permission = program.type === 's3' && (program.detail as ProgramDetail['s3']).acl
      ? undefined
      : isAllPublic.value

    const path = file.path || ''
    const { data: res } = await apiClient.upload(program.type, { path, permission })

    uploadDataStore.setData(
      {
        ...res,
        uploadFailed: false,
        time: new Date().toISOString(),
        uploaded: true,
      },
      index,
    )
    window.$message.success('上传成功')
  }
  catch (error: any) {
    const errorMessage = error.message || '上传失败'
    window.$message.error(errorMessage)
    uploadDataStore.setData({ uploadFailed: true }, index)
  }
  finally {
    uploadDataStore.setData({ isLoading: false }, index)
    if (isGetRecord)
      uploadDataStore.getUploadData()
  }
}

// 全部上传方法
async function allUploadImage() {
  const uploadList = data.value.filter(item => !item.url && !item.uploadFailed && !item.uploaded)

  if (!uploadList.length) {
    window.$message.info('没有需要上传的图片')
    return
  }

  const limit = pLimit(3)
  const uploadingTasks = new Set()
  isUpload.value = true

  const tasks = uploadList.map((item, index) => {
    if (item.url || item.uploadFailed || item.uploaded) {
      window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
      return null
    }

    if (!item.fileInfo?.file) {
      window.$message.error(`图片 ${index + 1} 文件对象无效，无法上传。`)
      return null
    }

    const originalIndex = data.value.indexOf(item)

    const task = limit(() =>
      uploadImage(originalIndex, item.fileInfo!.file!, false)
        .then(() => {
          uploadingTasks.delete(task)
          if (uploadingTasks.size === 0) {
            isUpload.value = false
            uploadDataStore.getUploadData()
          }
        })
        .catch((error) => {
          window.$message.error(`图片 ${originalIndex + 1} 上传失败：${error.message}`)
        }),
    )

    uploadingTasks.add(task)
    return task
  }).filter(Boolean)

  await Promise.all(tasks)
}

function delImage(index: number) {
  if (isImgListDelDialog.value) {
    uploadDataStore.delData(index)
    return
  }

  const n = window.$dialog.warning({
    title: '提示',
    content: '确定删除该图片吗？不会删除数据库和图床中的图片。',
    autoFocus: false,
    action: () => {
      return h('div', { class: 'wh-full flex-center justify-between' }, [
        h(NCheckbox, {
          'class': 'text-3',
          'checked': isImgListDelDialog.value,
          'onUpdate:checked': (newValue: boolean) => {
            appStore.setState({ isImgListDelDialog: newValue })
          },
        }, () => '不再显示此对话框'),
        h('div', {}, [
          h(NButton, {
            size: 'small',
            class: 'mr4',
            onClick: () => n.destroy(),
          }, {
            default: () => '取消',
          }),
          h(NButton, {
            type: 'warning',
            size: 'small',
            onClick: () => {
              uploadDataStore.delData(index)
              n.destroy()
            },
          }, {
            default: () => '确定',
          }),
        ]),
      ])
    },
  })
}

function allClear() {
  uploadDataStore.delData()
}

function copyLink(type: string, url: string, name: string) {
  const link = generateLink(type, url, name)
  navigator.clipboard
    .writeText(link)
    .then(() => window.$message.success('复制成功'))
    .catch(() => window.$message.error('复制失败'))
}

function copyAllUrl() {
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

const debouncedAllUploadImage = debounce(async () => {
  if (isUpload.value) {
    window.$message.info('上传正在进行中，请稍候...')
    return
  }
  await allUploadImage()
}, 1000)

window.ipcRenderer.on('upload-shortcut', () => {
  debouncedAllUploadImage()
})
</script>

<template>
  <template v-if="data.length">
    <n-flex class="my2 ml1 wfull">
      <n-button
        type="primary"
        secondary
        :disabled="!hasUploadableImages || isUpload"
        @click="allUploadImage"
      >
        全部上传
      </n-button>
      <n-button type="error" secondary @click="allClear">
        清空列表
      </n-button>
      <n-button
        secondary
        :disabled="!data.some(item => item?.url)"
        @click="copyAllUrl"
      >
        复制全部URL
      </n-button>
      <n-select
        v-model:value="isAllPublic"
        class="w30"
        :options="isPublicOptions"
        :disabled="hasPresetAcl"
        :title="hasPresetAcl ? '当前存储程序已设置默认访问控制' : ''"
      />
      <n-select
        v-model:value="defaultProgram"
        class="w30"
        :options="programs"
        @update:value="resetUploadState"
      />
    </n-flex>
    <n-image-group>
      <n-grid cols="3 l:5 xl:6 2xl:8" responsive="screen" :x-gap="12" :y-gap="8">
        <n-grid-item v-for="(file, index) in data" :key="index">
          <n-card class="relative not-last:mb2">
            <template #header>
              <n-ellipsis class="max-w55 pr2 text-4 font-400">
                {{ file.fileInfo?.name }}
              </n-ellipsis>
              <div
                class="absolute right-.5 top-.5 size-5 cursor-pointer text-dark-50 transition hover:text-red"
                i-ic-round-close
                @click="delImage(index)"
              />
            </template>
            <n-spin :show="file.isLoading">
              <n-image class="h50 wfull border-rd-sm" :src="file.fileUrl" object-fit="cover" style="image-rendering: optimizeQuality;" />
            </n-spin>
            <template #description>
              <span v-if="file.isLoading">正在上传，请耐心等待...</span>
            </template>
            <template #footer>
              <n-flex justify="center">
                <template v-if="file && file.url && file.origin_name">
                  <n-dropdown
                    trigger="hover"
                    :options="getLinkTypeOptions()"
                    @select="(type) => copyLink(type, file.url!, file.origin_name!)"
                  >
                    <n-button secondary strong class="wfull" type="info" @click="copyLink('url', file.url, file.origin_name)">
                      复制链接
                    </n-button>
                  </n-dropdown>
                </template>
                <template v-else>
                  <n-button
                    tertiary
                    class="wfull"
                    :disabled="file.isLoading || !file.fileInfo?.file"
                    type="primary"
                    @click="file.fileInfo?.file && uploadImage(index, file.fileInfo.file)"
                  >
                    上传
                  </n-button>
                </template>
              </n-flex>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-image-group>
  </template>
</template>

<style scoped>
:deep(.n-card) {
  --n-padding-top: 5px !important;
  --n-padding-bottom: 5px !important;
  --n-padding-left: 10px !important;
  --n-padding-right: 10px !important;
  --uno: rounded-2;
}

:deep(.n-image) > img {
  --uno: wh-full;
  object-fit: cover; /* 确保图片覆盖容器 */
  transition: transform 0.2s ease; /* 添加平滑过渡效果 */
}

:deep(.n-image:hover) > img {
  transform: scale(1.03); /* 鼠标悬停时轻微放大效果 */
}

/* 优化按钮悬停效果 */
:deep(.n-button:not(:disabled):hover) {
  opacity: 0.9;
}
</style>
