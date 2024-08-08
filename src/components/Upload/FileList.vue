<script setup lang="ts">
import { NButton, NCheckbox } from 'naive-ui'
import pLimit from 'p-limit'
import { generateLink, getLinkTypeOptions, selectProgramsOptions } from '~/utils'
import requestData from '~/api'
import type { UploadData } from '~/stores'
import { useAppStore, useProgramsStore, useUploadDataStore } from '~/stores'
import debounce from '~/utils/debounce'

const appStore = useAppStore()
const programsStore = useProgramsStore()
const uploadDataStore = useUploadDataStore()
const { defaultPrograms, isImgListDelDialog } = storeToRefs(appStore)
const { data } = storeToRefs(uploadDataStore)
const isAllPublic = ref(1)
const isUpload = ref(false)
const uploadProgramsId = ref(defaultPrograms.value)

const isPublicOptions = [
  { label: '全部公开', value: 1 },
  { label: '全部私有', value: 0 },
]

const programs = computed(() => programsStore.getPrograms(uploadProgramsId.value))

// 上传方法
async function uploadImage(index: number, file: File, isGetRecord: boolean = true) {
  if (!defaultPrograms.value) {
    window.$message.error('你要上传到那个存储程序呢？🤔')
    return
  }

  if (programs.value.api === '' || programs.value.token === '') {
    window.$message.error('不配置存储程序，我怎么上传？🤔')
    return
  }

  if (programs.value.strategiesVal === null) {
    window.$message.error('我还不知道你要存在那个策略中啊！😓')
    return
  }

  // 检查文件是否已经上传
  if (data.value[index].uploaded) {
    window.$message.info(`图片 ${index + 1} 已经上传过了，将跳过此图片。`)
    return
  }

  uploadDataStore.setData({ isLoading: true }, index)

  try {
    const { data: responseData, status } = await requestData.uploadImage(uploadProgramsId.value, programs.value.api, programs.value.token, {
      file,
      permission: isAllPublic.value,
      strategy_id: programs.value.strategiesVal,
    })

    if (status !== 200) {
      window.$message.error('上传失败')
      uploadDataStore.setData({ uploadFailed: true }, index)
      return
    }

    if (!responseData.status) {
      window.$message.error(responseData.message)
      uploadDataStore.setData({ uploadFailed: true }, index)
      return
    }

    console.log(responseData.data)

    const { key, name, size, mimetype, links, origin_name } = responseData.data

    uploadDataStore.setData(
      {
        key,
        name,
        size,
        mimetype,
        url: links.url,
        origin_name,
        uploadFailed: false,
        time: new Date().toISOString(),
        isPublic: isAllPublic.value,
        strategies: programs.value.strategiesVal,
        uploaded: true, // 标记文件为已上传
      },
      index,
    )
    window.$message.success('上传成功')
  }
  catch {
    window.$message.error('上传失败')
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
  if (!defaultPrograms.value) {
    window.$message.error('你要上传到那个存储程序呢？🤔')
    return
  }

  if (programs.value.api === '' || programs.value.token === '') {
    window.$message.error('不配置存储程序，我怎么上传？🤔')
    return
  }

  if (programs.value.strategiesVal === null) {
    window.$message.error('我还不知道你要存在哪个策略中啊！😓')
    return
  }

  const uploadList = data.value.filter((item: any) => !item.links && !item.uploadFailed && !item.uploaded)

  if (!uploadList.length) {
    window.$message.info('没有需要上传的图片。')
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
    content: '确定删除该图片吗？不会删除上传日志和图床中的图片。',
    autoFocus: false,
    action: () => {
      return h('div', { class: 'wh-full flex-center justify-between' }, [
        h(
          NCheckbox,
          {
            'class': 'text-3',
            'checked': isImgListDelDialog.value,
            'onUpdate:checked': (newValue: boolean) => {
              appStore.setState({ isImgListDelDialog: newValue })
            },
          },
          () => '不再显示此对话框',
        ),
        h('div', {}, [
          h(
            NButton,
            {
              size: 'small',
              class: 'mr4',
              onClick: () => {
                n.destroy()
              },
            },
            {
              default: () => '取消',
            },
          ),
          h(
            NButton,
            {
              type: 'warning',
              size: 'small',
              onClick: () => {
                uploadDataStore.delData(index)
                n.destroy()
              },
            },
            {
              default: () => '确定',
            },
          ),
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
  console.log('快捷键触发了')
  debouncedAllUploadImage()
})
</script>

<template>
  <template v-if="data.length">
    <n-flex my2 ml1 wfull>
      <NButton type="primary" :disabled="data.length <= 1 || isUpload" @click="allUploadImage">
        全部上传
      </NButton>
      <NButton type="error" @click="allClear">
        清空列表
      </NButton>
      <NButton type="info" :disabled="false" @click="copyAllUrl">
        复制全部URL
      </NButton>
      <n-select v-model:value="isAllPublic" w30 :options="isPublicOptions" />
      <n-select v-model:value="uploadProgramsId" w30 :options="selectProgramsOptions" />
    </n-flex>
    <n-image-group>
      <n-grid cols="3 l:5 xl:6 2xl:8" responsive="screen" :x-gap="12" :y-gap="8">
        <n-grid-item v-for="(file, index) in data" :key="index">
          <n-card content-style="padding: 5px;" class="relative not-last:mb2">
            <template #header>
              <n-ellipsis style="max-width: 220px" class="text-4 font-400">
                {{ file.fileInfo?.name }}
              </n-ellipsis>
              <NButton quaternary class="absolute right-.5 top-.5 h5 w5" @click="delImage(index)">
                <template #icon>
                  <div i-ic-sharp-close h5 w5 text-dark-50 />
                </template>
              </NButton>
            </template>
            <n-spin :show="file.isLoading">
              <n-flex justify="center" class="h50">
                <n-image :src="file.fileUrl" object-fit="cover" style="border-radius: 2px; image-rendering: optimizeQuality;" />
              </n-flex>
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
                    secondary strong class="wfull"
                    :disabled="file.isLoading"
                    type="primary"
                    @click="file.fileInfo && file.fileInfo.file && uploadImage(index, file.fileInfo.file)"
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
