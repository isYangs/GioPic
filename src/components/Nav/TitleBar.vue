<script setup lang="ts">
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { appCloseTip, appCloseType } = storeToRefs(appStroe)
const defaultWindowState = ref(false)
const appCloseTipModal = ref(false)
const appCloseTipCheckbox = ref(false)

function handleAppmin() {
  window.ipcRenderer.send('window-min')
}

function handleAppMaxOrRestore() {
  window.ipcRenderer.send('window-maxOrRestore')
}

function handleAppClose() {
  appCloseTipModal.value = false
  window.ipcRenderer.send('window-close')
}
function handleAppHide() {
  appCloseTipModal.value = false
  window.ipcRenderer.send('window-hide')
}

function handleOpneAppCloseTip() {
  if (appCloseTip.value) {
    appCloseTipModal.value = true
    appCloseTipCheckbox.value = false
  }
  else {
    appCloseType.value === 'close' ? handleAppClose() : handleAppHide()
  }
}

function handleAppCloseTip(type: string) {
  switch (type) {
    case 'close':
      if (appCloseTipCheckbox.value)
        appCloseTip.value = false
      appCloseType.value = 'close'
      handleAppClose()
      break
    case 'hide':
      if (appCloseTipCheckbox.value)
        appCloseTip.value = false
      appCloseType.value = 'hide'
      appCloseTipModal.value = false
      setTimeout(handleAppHide, 500)
      break
    default:
      appCloseTipModal.value = false
      appCloseTipCheckbox.value = false
  }
}
window.ipcRenderer.on('window-maxOrRestore-reply', (_, val) => {
  defaultWindowState.value = val
})
</script>

<template>
  <div w37 flex="~ center">
    <n-button :focusable="false" quaternary mr2 h8 w8 rounded-1.5 @click="handleAppmin">
      <template #icon>
        <div i-mdi-window-minimize />
      </template>
    </n-button>
    <n-button :focusable="false" quaternary mr2 h8 w8 rounded-1.5>
      <template #icon>
        <div :class="defaultWindowState ? 'i-mdi-window-restore' : 'i-mdi-window-maximize' " @click="handleAppMaxOrRestore" />
      </template>
    </n-button>
    <n-button :focusable="false" quaternary mr2 h8 w8 rounded-1.5 @click="handleOpneAppCloseTip">
      <template #icon>
        <div i-mdi-window-close />
      </template>
    </n-button>
  </div>
  <n-modal
    v-model:show="appCloseTipModal"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="关闭程序"
    transform-origin="center"
  >
    <div mb2 text-4>
      确认关闭软件吗？
    </div>
    <n-checkbox
      v-model:checked="appCloseTipCheckbox"
    >
      记住且不再询问
    </n-checkbox>
    <template #footer>
      <n-flex justify="space-between">
        <n-button strong secondary :focusable="false" @click="handleAppCloseTip('cancel')">
          取消
        </n-button>
        <n-flex>
          <n-button strong secondary :focusable="false" @click="handleAppCloseTip('close')">
            退出
          </n-button>
          <n-button type="primary" :focusable="false" strong secondary @click="handleAppCloseTip('hide')">
            最小化
          </n-button>
        </n-flex>
      </n-flex>
    </template>
  </n-modal>
</template>
