<script setup lang="ts">
import { useAppStore } from '~/stores'
import { renderIcon } from '~/utils/main'
import { openSettingPanel } from '~/utils/modal'

const appStore = useAppStore()
const { themeAuto, themeType, appCloseTip, appCloseType } = storeToRefs(appStore)
const route = useRoute()
const router = useRouter()

const canGoBack = ref(false)
const canGoForward = ref(false)
watch(() => route.fullPath, () => {
  canGoBack.value = !!window.history.state.back
  canGoForward.value = !!window.history.state.forward
})

const isMaximized = ref(false)
const showCloseTipModal = ref(false)
const rememberChoice = ref(false)

const themeOptions = computed(() => [
  {
    label: themeType.value === 'light' ? '深色模式' : '浅色模式',
    key: 'themeSwitch',
    icon: renderIcon(themeType.value === 'light' ? 'i-ph-moon-stars-bold' : 'i-ph-sun-bold'),
  },
  {
    label: '程序设置',
    key: 'setting',
    icon: renderIcon('i-ph-gear-six-bold'),
  },
])

const dropdownOptions = {
  themeSwitch: () => {
    themeType.value = themeType.value === 'dark' ? 'light' : 'dark'
    window.$message.info(`已切换至${themeType.value === 'light' ? '浅色' : '深色'}模式`, { showIcon: false })
    themeAuto.value = false
  },
  setting: () => {
    openSettingPanel()
  },
}

function onDropdownClick(key: keyof typeof dropdownOptions) {
  dropdownOptions[key]()
}

const windowActions = {
  minimize: () => window.ipcRenderer.invoke('window-min'),
  toggleMaximize: async () => {
    isMaximized.value = await window.ipcRenderer.invoke('window-maxOrRestore')
  },
  close: async () => {
    await window.ipcRenderer.invoke('window-close')
    showCloseTipModal.value = false
  },
  hide: async () => {
    // FIXME 先关闭弹窗，再隐藏窗口
    await window.ipcRenderer.invoke('window-hide')
    showCloseTipModal.value = false
  },
}

function onCloseClick() {
  if (!appCloseTip.value) {
    appCloseType.value === 'close' ? windowActions.close() : windowActions.hide()
    return
  }
  showCloseTipModal.value = true
  rememberChoice.value = false
}

/** 执行关闭主窗口操作 */
const closeTipModalActions = {
  close: () => {
    if (rememberChoice.value) {
      appCloseType.value = 'close'
      appCloseTip.value = false
    }
    windowActions.close()
  },
  hide: () => {
    if (rememberChoice.value) {
      appCloseType.value = 'hide'
      appCloseTip.value = false
    }
    showCloseTipModal.value = false
    setTimeout(windowActions.hide, 500)
  },
  cancel: () => {
    showCloseTipModal.value = false
  },
}
</script>

<template>
  <nav class="draggable h9 wfull flex select-none items-center">
    <div class="flex flex-1 justify-between">
      <div class="no-draggable flex items-center gap1 p1">
        <n-button :focusable="false" quaternary size="small" class="h6 w6 rounded-1.5" :disabled="!canGoBack" @click="router.go(-1)">
          <template #icon>
            <div i-ph-caret-left-bold />
          </template>
        </n-button>
        <n-button v-if="canGoForward" :focusable="false" size="small" quaternary class="h6 w6 rounded-1.5" @click="router.go(1)">
          <template #icon>
            <div i-ph-caret-right-bold />
          </template>
        </n-button>
      </div>

      <div class="no-draggable flex-center">
        <n-dropdown :options="themeOptions" trigger="click" @select="onDropdownClick">
          <n-button :focusable="false" quaternary size="small" class="h6 w6">
            <template #icon>
              <div i-ph-gear-six-bold />
            </template>
          </n-button>
        </n-dropdown>
        <div class="window-title-bar ml2 h9 flex">
          <div @click="windowActions.minimize">
            <div i-ic-round-minus />
          </div>
          <div @click="windowActions.toggleMaximize">
            <div :class="isMaximized ? 'i-material-symbols-chrome-restore-outline' : 'i-material-symbols-chrome-maximize-outline'" />
          </div>
          <div class="!hover:bg-red-5 !hover:text-light" @click="onCloseClick">
            <div i-ic-round-close />
          </div>
        </div>
      </div>
    </div>
  </nav>
  <n-modal
    v-model:show="showCloseTipModal"
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
    <n-checkbox v-model:checked="rememberChoice">
      记住且不再询问
    </n-checkbox>
    <template #footer>
      <n-flex justify="space-between">
        <n-button strong secondary :focusable="false" @click="closeTipModalActions.cancel()">
          取消
        </n-button>
        <n-flex>
          <n-button strong secondary :focusable="false" @click="closeTipModalActions.close()">
            退出
          </n-button>
          <n-button type="primary" :focusable="false" strong secondary @click="closeTipModalActions.hide()">
            最小化
          </n-button>
        </n-flex>
      </n-flex>
    </template>
  </n-modal>
</template>

<style scoped>
.window-title-bar > div {
  --uno: hfull w10 flex-center;
  transition:
    all 0.3s,
    color 0.1s;
}

.window-title-bar > div:hover {
  background-color: var(--n-border-color);
}
</style>
