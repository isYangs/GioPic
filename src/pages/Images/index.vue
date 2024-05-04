<script setup lang="ts">
import * as dayjs from 'dayjs'
import { convertFileSize, generateLink, getLinkTypeOptions } from '~/utils'

const uploadData = ref<GP.DB.UploadData[]>([])
const imagesInfoModal = ref(false)
const currentImagesData = ref<GP.DB.UploadData | null>(null)

onMounted(() => {
  getUploadData()
})

window.ipcRenderer.on('get-uploadData-status', (_e, data) => {
  uploadData.value = data
})

function getUploadData() {
  window.ipcRenderer.send('get-uploadData')
}

function delImage(key: string) {
  window.ipcRenderer.send('delete-uploadData', key)
  getUploadData()
}

function copyLink(type: string, key: string) {
  const res = uploadData.value.filter(item => item.key === key)
  const link = generateLink(type, res[0].url, res[0].name)
  navigator.clipboard
    .writeText(link)
    .then(() => {
      window.$message.success('复制成功')
    })
    .catch(() => {
      window.$message.error('复制失败')
    })
}

function openImagesInfoModal(data: GP.DB.UploadData) {
  imagesInfoModal.value = true
  currentImagesData.value = data
}
</script>

<template>
  <div>
    <n-image-group>
      <n-grid v-if="uploadData.length > 0" cols="3 l:5 xl:6 2xl:8" responsive="screen" :x-gap="12" :y-gap="8">
        <n-grid-item v-for="item in uploadData" :key="item.key">
          <n-card relative>
            <template #header>
              <n-ellipsis style="max-width: 220px" text-4 font-400>
                {{ item.name }}
              </n-ellipsis>
              <n-button quaternary absolute right-0 top-.5 h5 w5 @click="delImage(item.key)">
                <template #icon>
                  <div i-ic-sharp-close h5 w5 text-dark-50 />
                </template>
              </n-button>
            </template>
            <n-flex justify="center" h50>
              <n-image :src="item.url" object-fit="cover" />
            </n-flex>
            <template #footer>
              <n-flex justify="center">
                <n-dropdown trigger="hover" :options="getLinkTypeOptions()" @select="(type) => copyLink(type, item.key)">
                  <n-button secondary strong @click="copyLink('url', item.key)">
                    复制链接
                  </n-button>
                </n-dropdown>
                <n-button secondary strong @click="openImagesInfoModal(item)">
                  详细信息
                </n-button>
              </n-flex>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-image-group>
    <n-empty v-if="uploadData.length === 0" mt40 size="large" description="还没有图片，快去上传图片吧">
      <template #icon>
        <div i-icon-park-outline-error-picture h11 w11 />
      </template>
    </n-empty>
    <n-modal
      v-model:show="imagesInfoModal"
      :auto-focus="false"
      :mask-closable="false"
      :bordered="false"
      :close-on-esc="false"
      preset="card"
      title="图片详情"
      size="huge"
    >
      图片名称：{{ currentImagesData?.name }}
      <n-divider />
      图片大小：{{ convertFileSize(Number(currentImagesData?.size), true) }}
      <n-divider />
      图片类型：{{ currentImagesData?.mimetype }}
      <n-divider />
      上传时间：{{ dayjs(currentImagesData?.time).format('YYYY-MM-DD HH:mm:ss') }}
    </n-modal>
  </div>
</template>

<style scoped>
:deep(.n-card) {
  --n-padding-top: 5px !important;
  --n-padding-bottom: 5px !important;
  --n-padding-left: 10px !important;
  --n-padding-right: 10px !important;
  --uno: rounded-2;
  min-width: 220px;
  max-width: 240px;
}

:deep(.n-image) > img {
  --uno: wh-full;
}
</style>
