<script setup lang="ts">
import { useAppStore } from '~/stores'

const appStore = useAppStore()
const { appCloseTip, appCloseType } = storeToRefs(appStore)
const defaultWindowState = ref(false)
const closeTipModal = ref(false)
const closeTipCheckbox = ref(false)

function minimizeApp() {
  window.ipcRenderer.invoke('window-min')
}

async function toggleMaximizeOrRestoreApp() {
  const isMaximized = await window.ipcRenderer.invoke('window-maxOrRestore')
  defaultWindowState.value = isMaximized
}

function closeApp() {
  closeTipModal.value = false
  window.ipcRenderer.invoke('window-close')
}

function hideApp() {
  closeTipModal.value = false
  window.ipcRenderer.invoke('window-hide')
}

function openCloseTipModal() {
  if (appCloseTip.value) {
    closeTipModal.value = true
    closeTipCheckbox.value = false
  }
  else {
    if (appCloseType.value === 'close') {
      closeApp()
    }
    else {
      hideApp()
    }
  }
}

function closeTip(type: string) {
  switch (type) {
    case 'close':
      if (closeTipCheckbox.value)
        appCloseTip.value = false

      appCloseType.value = 'close'
      closeApp()
      break
    case 'hide':
      if (closeTipCheckbox.value)
        appCloseTip.value = false

      appCloseType.value = 'hide'
      closeTipModal.value = false
      setTimeout(hideApp, 500)
      break
    default:
      closeTipModal.value = false
      closeTipCheckbox.value = false
  }
}
</script>

<template>
  <div class="w37 flex-center">
    <n-button :focusable="false" quaternary class="mr2 h8 w8 rounded-1.5" @click="minimizeApp">
      <template #icon>
        <div i-ic-round-minus />
      </template>
    </n-button>
    <n-button :focusable="false" quaternary class="mr2 h8 w8 rounded-1.5" @click="toggleMaximizeOrRestoreApp">
      <template #icon>
        <div :class="defaultWindowState ? 'i-material-symbols-chrome-restore-outline' : 'i-material-symbols-chrome-maximize-outline'" />
      </template>
    </n-button>
    <n-button :focusable="false" quaternary class="mr2 h8 w8 rounded-1.5" @click="openCloseTipModal">
      <template #icon>
        <div i-ic-round-close />
      </template>
    </n-button>
  </div>
  <n-modal
    v-model:show="closeTipModal"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="关闭程序"
    transform-origin="center"
  >
    <div class="mb2 text-4">
      确认关闭软件吗？
    </div>
    <n-checkbox v-model:checked="closeTipCheckbox">
      记住且不再询问
    </n-checkbox>
    <template #footer>
      <n-flex justify="space-between">
        <n-button strong secondary :focusable="false" @click="closeTip('cancel')">
          取消
        </n-button>
        <n-flex>
          <n-button strong secondary :focusable="false" @click="closeTip('close')">
            退出
          </n-button>
          <n-button type="primary" :focusable="false" strong secondary @click="closeTip('hide')">
            最小化
          </n-button>
        </n-flex>
      </n-flex>
    </template>
  </n-modal>
</template>
