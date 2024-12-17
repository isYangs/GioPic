<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, dateZhCN, useOsTheme, zhCN } from 'naive-ui'
import { createTextVNode } from 'vue'
import { useAppStore } from '~/stores'
import { openUpdateAvailable, openUpdateRestart } from '~/utils/modal'

const appStore = useAppStore()
const {
  ignoreVersion,
  updateAtNext,
  themeType,
  themeAuto,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()
const theme = ref(themeType.value === 'dark' ? darkTheme : null)

const themeOverrides: GlobalThemeOverrides = {
  Typography: {
    // headerBarColor: 'currentColor',
  },
}

function setupNaiveTools() {
  // 对话框
  window.$dialog = useDialog()
  // 消息
  window.$message = useMessage()
  // 通知
  window.$notification = useNotification()
  // 加载条
  window.$loadingBar = useLoadingBar()
  // 模态框
  window.$modal = useModal()
}

const NaiveProviderContext = defineComponent({
  setup() {
    setupNaiveTools()
    return () => createTextVNode()
  },
})

// 监听主题变化
watch(themeType, (val) => {
  if (val === 'dark')
    theme.value = darkTheme
  else
    theme.value = null
})

// 监听系统主题变化
watch(osThemeRef, (val) => {
  if (themeAuto)
    themeType.value = val
})

// 监听更新提示信息
window.ipcRenderer.on('update-show-toast', (_e, message) => {
  window.ipcRenderer.invoke('window-show')
  window.$message.info(message)
})

// 监听更新版本更新
window.ipcRenderer.on('update-show-release', (_e, releaseVersion, releaseContent) => {
  ignoreVersion.value = ''
  updateAtNext.value = false
  openUpdateAvailable(releaseVersion, releaseContent)
})

// 监听更新重启
window.ipcRenderer.on('update-show-update-restart', (_e, forceUpdate) => {
  openUpdateRestart(forceUpdate)
})
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme
    :theme-overrides
    abstract
    inline-theme-disabled
  >
    <n-loading-bar-provider>
      <n-modal-provider>
        <n-dialog-provider>
          <n-notification-provider :max="1" container-style="margin-top:3.5rem">
            <n-message-provider :max="1" placement="bottom">
              <slot />
              <NaiveProviderContext />
            </n-message-provider>
          </n-notification-provider>
        </n-dialog-provider>
      </n-modal-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
