<script setup lang="ts">
import { NInput, NSelect } from 'naive-ui'

// import { useAppStore, useUserStore } from '~/stores'

// const appStore = useAppStore()
// const userStore = useUserStore()
// const { apiUrl, apiUrlTitle, bgImgUrl, recordSavePath } = storeToRefs(appStore)
// const { name, getCacpacity, getSize, imageNum } = storeToRefs(userStore)

// if (recordSavePath.value)
// window.ipcRenderer.send('get-ur-file', recordSavePath.value)

// onBeforeMount(() => {
//   appStore.setState({ isSettingsDrawer: false }) // 防止保存时出现错误，在挂载时重置设置面板的显示状态
// })

const api = ref('')

const lskySettingOptions = [
  {
    name: 'API 地址',
    tip: 'https://example.com (必须包含http://或https://)',
    component: () => {
      return h(NInput, {
        'value': api.value,
        'onUpdate:value': (val: string) => {
          console.log(val)
        },
        'options': [
          { label: '浅色模式', value: 'light' },
          { label: '深色模式', value: 'dark' },
        ],
      })
    },
  },
]
</script>

<template>
  <div>
    <n-tabs type="segment" animated>
      <n-tab-pane name="upload" tab="上传图片">
        <Upload />
      </n-tab-pane>
      <n-tab-pane name="record" tab="上传记录">
        上传记录
      </n-tab-pane>
      <n-tab-pane name="set" tab="设置">
        <SetItem title="兰空图床设置" :items="lskySettingOptions" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped></style>
