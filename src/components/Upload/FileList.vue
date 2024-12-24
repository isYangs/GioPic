<script setup lang="ts">
import { NButton, NCheckbox } from 'naive-ui'
import pLimit from 'p-limit'
import request from '~/api'
import { type UploadData, useAppStore, useProgramStore, useUploadDataStore } from '~/stores'
import debounce from '~/utils/debounce'
import { generateLink, getLinkTypeOptions } from '~/utils/main'

const appStore = useAppStore()
const programStore = useProgramStore()
const uploadDataStore = useUploadDataStore()
const { defaultProgram, isImgListDelDialog } = storeToRefs(appStore)
const { data } = storeToRefs(uploadDataStore)
const isAllPublic = ref(1)
const isUpload = ref(false)

const isPublicOptions = [
  { label: '全部公开', value: 1 },
  { label: '全部私有', value: 0 },
]

if (!defaultProgram.value || !programStore.getProgram(defaultProgram.value).id) {
  defaultProgram.value = null
}

const programs = computed(() => programStore.getProgramList())

function resetUploadState() {
  data.value.forEach((item, index) => {
    if (item.uploadFailed) {
      uploadDataStore.setData({ uploadFailed: false }, index)
    }
  })
}
// 上传方法
async function uploadImage(index: number, file: File, isGetRecord: boolean = true) {
  if (!defaultProgram.value) {
    window.$message.error('请选择存储程序后再上传')
    return
  }
  // 检查文件是否已经上传
  if (data.value[index].uploaded) {
    window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
    return
  }

  uploadDataStore.setData({ isLoading: true }, index)

  try {
    const program = programStore.getProgram(defaultProgram.value)
    const imageMeta = await request.uploadImage(program, file, isAllPublic.value)

    uploadDataStore.setData(
      {
        ...imageMeta,
        uploadFailed: false,
        time: new Date().toISOString(),
        uploaded: true, // 标记文件为已上传
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
  const uploadList = data.value.filter((item: any) => !item.links && !item.uploadFailed && !item.uploaded)

  if (!uploadList.length) {
    window.$message.info('没有需要上传的图片鸭~')
    return
  }

  const limit = pLimit(3) // 最多同时进行 3 个上传任务

  // 创建一个数组来跟踪正在进行的上传任务
  const uploadingTasks = new Set()

  const tasks = uploadList.map((item: any, index: number) => {
    if (item.links || item.uploadFailed || item.uploaded) {
      window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
      return null
    }

    const originalIndex = data.value.indexOf(item)

    // 创建一个新的上传任务
    const task = limit(() =>
      uploadImage(originalIndex, item.fileInfo.file, false)
        .then(() => {
          // 从正在进行的上传任务中移除这个任务
          uploadingTasks.delete(task)
          // 检查是否所有的上传任务都已完成
          if (uploadingTasks.size === 0) {
            isUpload.value = false
            uploadDataStore.getUploadData()
          }
        })
        .catch((error) => {
          // 处理上传失败
          window.$message.error(`图片 ${originalIndex + 1} 上传失败：${error.message}`)
        }),
    )

    // 将这个任务添加到正在进行的上传任务中
    uploadingTasks.add(task)

    return task
  }).filter(task => task !== null)

  isUpload.value = true

  // 等待所有上传任务完成
  await Promise.all(tasks)
}

// 删除图片方法
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
            onClick: () => {
              n.destroy()
            },
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

// 清空列表方法
function allClear() {
  uploadDataStore.delData()
}

function copyLink(type: string, url: string, name: string) {
  const link = generateLink(type, url, name)
  navigator.clipboard
    .writeText(link)
    .then(() => {
      window.$message.success('复制成功')
    })
    .catch(() => {
      window.$message.error('复制失败')
    })
}

// 复制全部URL方法
function copyAllUrl() {
  const urlList = data.value.map((item: UploadData) => item?.url).filter((item: string | undefined) => item)

  if (!urlList.length) {
    window.$message.info('没有可以复制的图片链接')
    return
  }

  const url = urlList.join('\n')

  navigator.clipboard
    .writeText(url)
    .then(() => {
      window.$message.success('复制成功')
    })
    .catch(() => {
      window.$message.error('复制失败')
    })
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
      <NButton type="primary" secondary :disabled="!data.length || isUpload" @click="allUploadImage">
        全部上传
      </NButton>
      <NButton type="error" secondary @click="allClear">
        清空列表
      </NButton>
      <NButton secondary :disabled="false" @click="copyAllUrl">
        复制全部URL
      </NButton>
      <n-select v-model:value="isAllPublic" class="w30" :options="isPublicOptions" />
      <n-select v-model:value="defaultProgram" class="w30" :options="programs" @update:value="resetUploadState" />
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
              正在上传，请耐心等待...
            </template>
            <template #footer>
              <n-flex justify="center">
                <template v-if="file && file.url && file.origin_name">
                  <n-dropdown trigger="hover" :options="getLinkTypeOptions()" @select="(type:string) => file.url && file.origin_name && copyLink(type, file.url, file.origin_name)">
                    <NButton secondary strong class="wfull" type="info" @click="copyLink('url', file.url, file.origin_name)">
                      复制链接
                    </NButton>
                  </n-dropdown>
                </template>
                <template v-else>
                  <NButton
                    tertiary class="wfull"
                    :disabled="file.isLoading"
                    type="primary"
                    @click="file.fileInfo?.file && uploadImage(index, file.fileInfo.file)"
                  >
                    上传
                  </NButton>
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
}
</style>
