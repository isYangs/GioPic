<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, dateZhCN, useOsTheme, zhCN } from 'naive-ui'
import { createTextVNode } from 'vue'
import { useAppStore } from '~/stores'

const appStore = useAppStore()
const {
  ignoreVersion,
  updateAtNext,
  themeType,
  themeAuto,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()
const theme = ref(themeType.value === 'dark' ? darkTheme : null)

const showReleaseModal = ref(false)
const releaseVersion = ref('')
const releaseContent = ref('')
const showUpdateRestart = ref(false)
const forceUpdate = ref(false)

const themeOverrides: GlobalThemeOverrides = {
  Typography: {
    headerBarColor: 'currentColor',
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

// 监听更新事件
const updateHandlers: Record<string, (...args: any[]) => void> = {
  'show-toast': (...args) => {
    window.ipcRenderer.invoke('window-show')
    window.$message.info(args[0])
  },
  'show-release': (...args) => {
    ignoreVersion.value = ''
    updateAtNext.value = false
    releaseVersion.value = args[0]
    releaseContent.value = args[1]
    showReleaseModal.value = true
  },
  // 'show-update-progress': (_) => {
  //   showDialogUpdateProgress.value = true
  // },
  // 'update-update-progress': (...args) => {
  //   updateProgress.value = args[0]
  // },
  'show-update-restart': (...args) => {
    forceUpdate.value = args[0]
    showUpdateRestart.value = true
  },
}

window.ipcRenderer.on('update', (_e, type, ...args) => {
  const handler = updateHandlers[type]
  if (handler) {
    handler(...args)
  }
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
    <UpdateAvailable
      v-model="showReleaseModal"
      :release-version
      :release-content
    />
    <UpdateRestart
      v-model="showUpdateRestart"
      :force-update
    />
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider :max="1" container-style="margin-top:3.5rem">
          <n-message-provider :max="1" placement="bottom">
            <slot />
            <NaiveProviderContext />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
