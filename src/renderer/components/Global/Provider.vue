<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, dateZhCN, useOsTheme, zhCN } from 'naive-ui'
import { createTextVNode } from 'vue'
import { useAppStore } from '~/stores'
import { openSettingPanel, openUpdateAvailable, openUpdateRestart } from '~/utils/modal'

const appStore = useAppStore()
const {
  ignoreVersion,
  updateAtNext,
  themeType,
  themeAuto,
  sidebarWidth,
  enableAnimations,
  primaryColor,
  customPrimaryColor,
  showDockIcon,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()
const theme = ref(themeType.value === 'dark' ? darkTheme : null)

function generateCustomColors(baseColor: string) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    }).join('')}`
  }

  const adjustBrightness = (color: string, amount: number) => {
    const rgb = hexToRgb(color)
    if (!rgb)
      return color

    const adjust = (value: number) => Math.min(255, Math.max(0, Math.round(value + amount)))
    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
  }

  return {
    primaryColor: baseColor,
    primaryColorHover: adjustBrightness(baseColor, 20),
    primaryColorPressed: adjustBrightness(baseColor, -20),
    primaryColorSuppl: adjustBrightness(baseColor, 20),
  }
}

const themeOverrides = computed((): GlobalThemeOverrides => {
  const lightColorMap = {
    default: {
      primaryColor: '#18a058',
      primaryColorHover: '#36ad6a',
      primaryColorPressed: '#0c7a43',
      primaryColorSuppl: '#36ad6a',
    },
    blue: {
      primaryColor: '#2080f0',
      primaryColorHover: '#4098fc',
      primaryColorPressed: '#1060c9',
      primaryColorSuppl: '#4098fc',
    },
    purple: {
      primaryColor: '#722ed1',
      primaryColorHover: '#8a4fdd',
      primaryColorPressed: '#551a8b',
      primaryColorSuppl: '#8a4fdd',
    },
    orange: {
      primaryColor: '#fa8c16',
      primaryColorHover: '#ffb04a',
      primaryColorPressed: '#d97008',
      primaryColorSuppl: '#ffb04a',
    },
    red: {
      primaryColor: '#e03e3e',
      primaryColorHover: '#e85d5d',
      primaryColorPressed: '#c53030',
      primaryColorSuppl: '#e85d5d',
    },
  }

  const darkColorMap = {
    default: {
      primaryColor: '#63e2b7',
      primaryColorHover: '#7fe7c4',
      primaryColorPressed: '#50c890',
      primaryColorSuppl: '#7fe7c4',
    },
    blue: {
      primaryColor: '#3b82f6',
      primaryColorHover: '#60a5fa',
      primaryColorPressed: '#1d4ed8',
      primaryColorSuppl: '#60a5fa',
    },
    purple: {
      primaryColor: '#8b5cf6',
      primaryColorHover: '#a78bfa',
      primaryColorPressed: '#6d28d9',
      primaryColorSuppl: '#a78bfa',
    },
    orange: {
      primaryColor: '#f59e0b',
      primaryColorHover: '#fbbf24',
      primaryColorPressed: '#d97706',
      primaryColorSuppl: '#fbbf24',
    },
    red: {
      primaryColor: '#ef4444',
      primaryColorHover: '#f87171',
      primaryColorPressed: '#dc2626',
      primaryColorSuppl: '#f87171',
    },
  }

  const colorMap = themeType.value === 'dark' ? darkColorMap : lightColorMap
  let colors

  if (primaryColor.value === 'custom') {
    colors = generateCustomColors(customPrimaryColor.value)
  }
  else {
    colors = colorMap[primaryColor.value as keyof typeof colorMap] || colorMap.default
  }

  return {
    common: {
      primaryColor: colors.primaryColor,
      primaryColorHover: colors.primaryColorHover,
      primaryColorPressed: colors.primaryColorPressed,
      primaryColorSuppl: colors.primaryColorSuppl,
    },
    Typography: {
      // headerBarColor: 'currentColor',
    },
  }
})

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

watch(primaryColor, (val) => {
  document.documentElement.classList.remove('theme-default', 'theme-blue', 'theme-purple', 'theme-orange', 'theme-red', 'theme-custom')
  document.documentElement.classList.add(`theme-${val}`)
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

watch(showDockIcon, (val) => {
  window.ipcRenderer.invoke('dock-icon-show', val)
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
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme
    :theme-overrides="themeOverrides"
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
