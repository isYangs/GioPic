<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import {
  darkTheme,
  dateZhCN as dateLocale,
  zhCN as locale,
  useOsTheme,
} from 'naive-ui'
import { createTextVNode } from 'vue'

const appStore = useAppStore()
const {
  ignoreVersion,
  updateAtNext,
  themeType,
  themeAuto,
  sidebarWidth,
  borderRadius,
  enableAnimations,
  primaryColor,
  customPrimaryColor,
  showDockIcon,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()
const theme = ref(themeType.value === 'dark' ? darkTheme : null)

const themeOverrides = computed((): GlobalThemeOverrides => ({
  common: {
    ...generateCustomColors(primaryColor.value === 'custom'
      ? customPrimaryColor.value
      : getPrimaryColor(themeType.value, primaryColor.value),
    ),
    borderRadius: `${borderRadius.value}px`,
    borderRadiusSmall: `${Math.max(2, borderRadius.value - 2)}px`,
  },
  Typography: {
    // headerBarColor: 'currentColor',
  },
}))

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

watch(themeType, (val) => {
  if (val === 'dark') {
    theme.value = darkTheme
    document.documentElement.classList.add('dark')
  }
  else {
    theme.value = null
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

watch(enableAnimations, (val) => {
  if (val) {
    document.documentElement.classList.remove('no-animations')
  }
  else {
    document.documentElement.classList.add('no-animations')
  }
}, { immediate: true })

watch(sidebarWidth, (val) => {
  document.documentElement.style.setProperty('--sidebar-width', `${val}px`)
}, { immediate: true })

watch(borderRadius, (val) => {
  document.documentElement.style.setProperty('--giopic-border-radius', `${val}px`)
}, { immediate: true })

watch(showDockIcon, (val) => {
  callIpc('dock-icon-show', val)
}, { immediate: true })

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

// 监听打开设置
window.ipcRenderer.on('open-setting', (_e, tab?: string) => openSettingPanel(tab))
</script>

<template>
  <n-config-provider
    :locale
    :date-locale
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
              <naive-provider-context />
            </n-message-provider>
          </n-notification-provider>
        </n-dialog-provider>
      </n-modal-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
