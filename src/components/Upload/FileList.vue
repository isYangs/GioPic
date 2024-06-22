<script setup lang="ts">
import { NButton, NCheckbox } from 'naive-ui'
import pLimit from 'p-limit'
import { convertFileSize, getLinkType } from '~/utils'
import requestData from '~/api'
import type { UploadData } from '~/stores'
import { useAppStore, useStorageListStore, useUploadDataStore } from '~/stores'
import type { StorageListName } from '~/types'

const appStore = useAppStore()
const storageListStore = useStorageListStore()
const uploadDataStore = useUploadDataStore()
const { defaultStorage, imgLinkFormatVal, isImgListDelDialog } = storeToRefs(appStore)
const { storageList } = storeToRefs(storageListStore)
const { data } = storeToRefs(uploadDataStore)
const imgLinkTabsKey = ref(0)
const uploadStorageListId = ref(defaultStorage.value)
const isAllPublic = ref(1)
const isUpload = ref(false)

const isPublicOptions = [
  { label: '全部公开', value: 1 },
  { label: '全部私有', value: 0 },
]

function getKeys(type: StorageListName) {
  const storageIndex = storageList.value.findIndex(item => item.id === type)
  return storageList.value[storageIndex]
}

// 上传方法
async function uploadImage(index: number, file: File, isGetRecord: boolean = true) {
  if (!uploadStorageListId.value) {
    window.$message.error('你要上传到那个存储程序呢？🤔')
    return
  }

  const keys = getKeys(uploadStorageListId.value)
  if (keys.api === '' || keys.token === '') {
    window.$message.error('不配置存储程序，我怎么上传？🤔')
    return
  }

  if (keys.strategiesVal === null) {
    window.$message.error('我还不知道你要存在那个策略中啊！😓')
    return
  }

  uploadDataStore.setData({ isLoading: true }, index)

  try {
    const { data, status } = await requestData.uploadImage(keys.id, keys.api, keys.token, {
      file,
      permission: isAllPublic.value,
      strategy_id: keys.strategiesVal,
    })

    if (status !== 200) {
      window.$message.error('上传失败')
      uploadDataStore.setData({ uploadFailed: true }, index)
      return
    }

    if (!data.status) {
      window.$message.error(data.message)
      uploadDataStore.setData({ uploadFailed: true }, index)
      return
    }

    console.log(data.data)

    const { key, name, size, mimetype, links } = data.data

    uploadDataStore.setData(
      {
        key,
        name,
        size,
        mimetype,
        url: links.url,
        uploadFailed: false,
        time: new Date().toISOString(),
        isPublic: isAllPublic.value,
        strategies: keys.strategiesVal,
      },
      index,
    )
    imgLinkTabsKey.value++
    window.$message.success('上传成功')
  }
  catch (error) {
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
async function allUplaodImage() {
  if (!uploadStorageListId.value) {
    window.$message.error('你要上传到那个存储程序呢？🤔')
    return
  }

  const keys = getKeys(uploadStorageListId.value)
  if (keys.api === '' || keys.token === '') {
    window.$message.error('不配置存储程序，我怎么上传？🤔')
    return
  }

  if (keys.strategiesVal === null) {
    window.$message.error('我还不知道你要存在那个策略中啊！😓')
    return
  }

  const uploadList = data.value.filter((item: any) => !item.links && !item.uploadFailed)

  if (!uploadList.length) {
    window.$message.info('没有需要上传的图片')
    return
  }

  const limit = pLimit(3) // 最多同时进行 3 个上传任务

  // 创建一个数组来跟踪正在进行的上传任务
  const uploadingTasks = new Set()

  const tasks = uploadList.map((item: any, index: number) => {
    if (item.links || item.uploadFailed) {
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
function handleClose(index: number) {
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
function handleAllClear() {
  uploadDataStore.delData()
}

// 复制全部URL方法
function handleCopyAllUrl() {
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

// 监听图片链接格式选项卡变化，防止渲染出现问题
watch(imgLinkFormatVal, () => {
  imgLinkTabsKey.value++
})
</script>

<template>
  <template v-if="data.length">
    <n-flex my2 ml1 wfull>
      <NButton type="primary" :disabled="data.length <= 1 || isUpload" @click="allUplaodImage">
        全部上传
      </NButton>
      <NButton type="error" @click="handleAllClear">
        清空列表
      </NButton>
      <NButton type="info" :disabled="false" @click="handleCopyAllUrl">
        复制全部URL
      </NButton>
      <n-select v-model:value="isAllPublic" w30 :options="isPublicOptions" />
      <n-select v-model:value="uploadStorageListId" w30 :options="storageListStore.getStorageListOptions()" />
    </n-flex>
    <n-flex wfull justify="space-between">
      <n-image-group>
        <n-card v-for="(file, index) in data" :key="index" content-style="padding: 10px;" relative not-last="mb2">
          <n-spin :show="file.isLoading">
            <n-flex justify="space-between">
              <n-flex justify="center" h30 w52>
                <n-image :src="file.fileUrl" object-fit="cover" />
              </n-flex>
              <template v-if="file.url">
                <n-tabs :key="imgLinkTabsKey" flex="1 nowrap" overflow-auto type="line">
                  <n-tab-pane
                    v-for="linkType in imgLinkFormatVal"
                    :key="linkType"
                    wfull
                    :name="linkType"
                    :tab="getLinkType(linkType)"
                  >
                    <n-input v-model:value="file.url" type="text" placeholder="基本的 Input" />
                  </n-tab-pane>
                </n-tabs>
              </template>
              <template v-else>
                <n-tabs flex="1 nowrap" overflow-auto type="line">
                  <n-tab-pane wfull flex-1 name="file_info" tab="详情">
                    <div wh-full flex="center row wrap" justify-between>
                      <n-tag :bordered="false" type="info">
                        <span block max-w-100 text-overflow>文件名： {{ file.fileInfo ? file.fileInfo.name : '无' }}</span>
                      </n-tag>
                      <n-tag :bordered="false" type="info">
                        文件大小：{{ file.fileInfo ? convertFileSize(Number(file.fileInfo.file?.size)) : '无' }}
                      </n-tag>
                      <n-tag :bordered="false" type="info">
                        文件类型：{{ file.fileInfo ? file.fileInfo.type : '无' }}
                      </n-tag>
                      <NButton
                        size="small"
                        secondary
                        strong
                        @click="file.fileInfo && file.fileInfo.file && uploadImage(index, file.fileInfo.file)"
                      >
                        上传
                      </NButton>
                    </div>
                  </n-tab-pane>
                </n-tabs>
              </template>
            </n-flex>
            <template #description>
              正在上传，请耐心等待...
            </template>
          </n-spin>
          <NButton v-if="!file.isLoading" quaternary absolute right-2 top-.5 h5 w5 @click="handleClose(index)">
            <template #icon>
              <div i-ic-sharp-close h5 w5 text-dark-50 />
            </template>
          </NButton>
        </n-card>
      </n-image-group>
    </n-flex>
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
